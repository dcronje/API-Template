import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'
import Redlock, { Lock } from 'redlock'

const clients: { [k: string]: Redis } = {}

export const getClient = async ({ host, port, db }: { host: string, port: number, db: number }): Promise<Redis> => {
  const url = `redis://${host}:${port}/${db}`
  if (!clients[url] || ['close', 'end'].includes(clients[url].status)) {
    clients[url] = new Redis({
      port,
      host,
      db,
    })
  }
  return clients[url]
}

let redlock: Redlock | null = null
let pubSub: RedisPubSub | null = null

export class RedisHelper {

  private static ensurePublisher(): RedisPubSub {
    if (!pubSub) {
      const options = {
        host: process.env.REDIS_PUBSUB_HOST || 'localhost',
        port: process.env.REDIS_PUBSUB_PORT ? parseInt(process.env.REDIS_PUBSUB_PORT) : 6379,
        db: process.env.REDIS_PUBSUB_DB ? parseInt(process.env.REDIS_PUBSUB_DB) : 3,
        retryStrategy: (times: number) => {
          // reconnect after
          return Math.min(times * 50, 2000)
        },
      }
      pubSub = new RedisPubSub({
        connection: options,
      })
    }
    return pubSub
  }

  static async publish<T>(trigger: string, payload: T): Promise<void> {
    const localPubSub = this.ensurePublisher()
    await localPubSub.publish(trigger, payload)
  }

  static shared(): RedisHelper {
    if (!instance) {
      instance = new RedisHelper()
    }
    return instance
  }

  static getPubSub(): RedisPubSub {
    const localPubSub = this.ensurePublisher()
    return localPubSub
  }

  static async lock(key: string, duration = 30000): Promise<Lock | undefined> {
    if (!redlock) {
      const client = await getClient({
        host: process.env.REDIS_BROKER_HOST || 'localhost',
        port: process.env.REDIS_BROKER_PORT ? parseInt(process.env.REDIS_BROKER_PORT) : 6379,
        db: process.env.REDIS_BROKER_DB ? parseInt(process.env.REDIS_BROKER_DB) : 0,
      })
      redlock = new Redlock(
        [client],
        {
          // The expected clock drift; for more details see:
          // http://redis.io/topics/distlock
          driftFactor: 0.01, // multiplied by lock ttl to determine drift time

          // The max number of times Redlock will attempt to lock a resource
          // before erroring.
          retryCount: 60,

          // the time in ms between attempts
          retryDelay: 500, // time in ms

          // the max time in ms randomly added to retries
          // to improve performance under high contention
          // see https://www.awsarchitectureblog.com/2015/03/backoff.html
          retryJitter: 500, // time in ms

          // The minimum remaining time on a lock before an extension is automatically
          // attempted with the `using` API.
          automaticExtensionThreshold: 500, // time in ms
        },
      )
    }
    try {
      const lock = await redlock.acquire([key], duration)
      return lock
    } catch (e) {
      console.log(`COULD NOT LOCK: ${key}`)

    }
  }

}

let instance: RedisHelper | null = null

