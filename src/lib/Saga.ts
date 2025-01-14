import { getClient } from '@lib/RedisHelper'
import { Utilities } from '@lib/Utilities'
import { Redis } from 'ioredis'

const DEFAULT_RETRY_INTERVAL = 500
const DEFAULT_TTL = 10000
const DEFAULT_MAX_TRIES = 120

export class Saga<T, R> {

  id = Utilities.randomString(10)
  context: T
  preLocks: string[] = []
  validationFunctions: ((context: T, lock: (lock: string) => Promise<void>, abort: () => void) => Promise<T>)[] = []
  commitFuncions: ((context: T, functions: { abort: () => void, queue: (queueFunction: (locks: string[]) => Promise<void> | void) => void }) => Promise<T>)[] = []
  aggregationFuncion: ((context: T, wasAborted: boolean) => Promise<R>) | null = null
  rollbackFuncions: ((e: Error, context: T, functions: { queue: (queueFunction: (locks: string[]) => Promise<void> | void) => void }) => Promise<T>)[] = []
  queuedFunctions: ((locks: string[]) => Promise<void> | void)[] = []
  isAborted = false
  inheritedLockKeys: string[] = []
  lockKeys: string[] = []
  client: Redis | null = null

  constructor(context: T, preLocks: string[] = []) {
    this.context = context
    this.preLocks = preLocks
  }

  private async getClient(): Promise<Redis> {
    if (!this.client) {
      this.client = await getClient({
        host: process.env.REDIS_BROKER_HOST || 'localhost',
        port: process.env.REDIS_BROKER_PORT ? parseInt(process.env.REDIS_BROKER_PORT) : 6379,
        db: process.env.REDIS_BROKER_DB ? parseInt(process.env.REDIS_BROKER_DB) : 0,
      })
    }
    return this.client
  }

  private async redisLock(lockKey: string, ttl: number = DEFAULT_TTL, retryInterval: number = DEFAULT_RETRY_INTERVAL, maxTries: number = DEFAULT_MAX_TRIES): Promise<void> {
    const redisClient = await this.getClient()
    const lockValue = Math.random().toString(36).substring(2)
    let tries = 0
    while (true) {
      tries++
      const lockSet = await redisClient.set(lockKey, lockValue, 'EX', Math.round(ttl / 1000), 'NX'); // Lock expires in 30 seconds
      if (lockSet === 'OK') {
        break
      }
      if (tries === maxTries) {
        break
      }
      // Wait and retry if lock is not acquired
      await new Promise(resolve => setTimeout(resolve, retryInterval))
    }
  }

  private async redisRelease(lockKey: string): Promise<void> {
    const redisClient = await this.getClient()
    await redisClient.del(lockKey)
  }

  private async redisExtend(lockKey: string, newTtl: number = DEFAULT_TTL, retryInterval: number = DEFAULT_RETRY_INTERVAL, maxTries: number = DEFAULT_MAX_TRIES): Promise<void> {
    const redisClient = await this.getClient()
    const currentValue = await redisClient.get(lockKey);
    if (currentValue === null) {
      await this.redisLock(lockKey, newTtl, retryInterval, maxTries);
    } else {
      await redisClient.expire(lockKey, Math.round(newTtl / 1000));
    }
  }

  private async lock({ key, duration }: { key: string, duration: number }): Promise<void> {
    if (!this.lockKeys.includes(key) && !this.inheritedLockKeys.includes(key)) {
      this.lockKeys.push(key)
      await this.redisLock(key, duration)
    }
  }

  private async release({ key }: { key: string }): Promise<void> {
    try {
      if (this.lockKeys.includes(key) || this.inheritedLockKeys.includes(key)) {
        await this.redisRelease(key)
        this.lockKeys.splice(this.lockKeys.indexOf(key), 1)
      }
    } catch (e) {
      console.log(`ERROR RELEASING LOCK: ${key}`)
    }
  }

  private async extend({ key, duration }: { key: string, duration: number }): Promise<void> {
    if (this.lockKeys.includes(key) || this.inheritedLockKeys.includes(key)) {
      await this.redisExtend(key, duration)
    }
  }

  private async releaseAll(includingInherited = false): Promise<void> {
    for (let l = this.lockKeys.length - 1; l >= 0; l--) {
      try {
        await this.release({ key: this.lockKeys[l] })
      } catch (e) { }
    }

    if (includingInherited) {
      for (let l = this.inheritedLockKeys.length - 1; l >= 0; l--) {
        try {
          await this.release({ key: this.inheritedLockKeys[l] })
        } catch (e) { }
      }
    }
  }

  async extendAll(duration: number): Promise<void> {
    for (let l = 0; l < this.lockKeys.length; l++) {
      try {
        this.redisExtend(this.lockKeys[l], duration)
      } catch (e) {
        console.log(e)
      }
    }
    for (let l = 0; l < this.inheritedLockKeys.length; l++) {
      try {
        this.redisExtend(this.inheritedLockKeys[l], duration)
      } catch (e) {
        console.log(e)
      }
    }
  }

  validate(validationFunctions: (context: T, lock: (lock: string) => Promise<void>, abort: () => void) => Promise<T>): Saga<T, R> {
    this.validationFunctions.push(validationFunctions)
    return this
  }

  commit(commitFuncions: (context: T, functions: { abort: () => void, queue: (queueFunction: (locks: string[]) => Promise<void> | void) => void }) => Promise<T>): Saga<T, R> {
    this.commitFuncions.push(commitFuncions)
    return this
  }

  aggregate(aggregationFuncions: (context: T) => Promise<R>): Saga<T, R> {
    this.aggregationFuncion = aggregationFuncions
    return this
  }

  rollback(rollbackFuncions: (e: Error, context: T, functions: { queue: (queueFunction: (locks: string[]) => Promise<void> | void) => void }) => Promise<T>): Saga<T, R> {
    this.rollbackFuncions.push(rollbackFuncions)
    return this
  }

  async execute(args?: { locks?: string[], lockTTL?: number } | undefined): Promise<R> {

    const { locks = [], lockTTL = DEFAULT_TTL } = args || {}

    let context: T = this.context
    let result!: R
    try {
      // Extend inherited locks
      this.inheritedLockKeys = this.preLocks
      for (let l = 0; l < this.inheritedLockKeys.length; l++) {
        if (!this.lockKeys.includes(this.inheritedLockKeys[l])) {
          await this.extend({ key: this.inheritedLockKeys[l], duration: lockTTL })
        }
      }
      // lock all initial
      for (let l = 0; l < locks.length; l++) {
        await this.lock({ key: locks[l], duration: lockTTL })
      }
      // run all validations
      for (let v = 0; v < this.validationFunctions.length; v++) {
        if (!this.isAborted) {
          const result = await this.validationFunctions[v](
            context,
            async (lock: string): Promise<void> => {
              await this.lock({ key: lock, duration: lockTTL })
            },
            () => {
              this.isAborted = true
            },
          )
          context = result
          await this.extendAll(lockTTL)
        }
      }
      // run all commit functions
      try {
        for (let c = 0; c < this.commitFuncions.length; c++) {
          if (!this.isAborted) {
            await this.extendAll(lockTTL)
            const result = await this.commitFuncions[c](context, {
              abort: () => {
                this.isAborted = true
              },
              queue: (queueFunction: (locks: string[]) => Promise<void> | void) => {
                this.queuedFunctions.push(queueFunction)
              },
            })
            context = result
          }
        }
        if (!this.queuedFunctions.length) {
          await this.releaseAll()
        } else {
          await this.extendAll(lockTTL)
        }
        // run aggregation function
        if (this.aggregationFuncion) {
          result = await this.aggregationFuncion(context, this.isAborted)
        }
      } catch (e: any) {
        // run rollback functions
        for (let r = 0; r < this.rollbackFuncions.length; r++) {
          const result = await this.rollbackFuncions[r](e, context, {
            queue: (queueFunction: (locks: string[]) => Promise<void> | void) => {
              this.queuedFunctions.push(queueFunction)
            },
          })
          context = result
        }
      }
    } finally {
      try {
        // run all queued functions
        for (let q = 0; q < this.queuedFunctions.length; q++) {
          const allLocks = this.lockKeys
          this.inheritedLockKeys.forEach((key) => {
            if (!allLocks.includes(key)) {
              allLocks.push(key)
            }
          })
          try {
            await this.queuedFunctions[q](allLocks)
          } catch (e) { }
        }
      } catch (e) {
        console.log(e)
      }
      await this.releaseAll()
    }
    return result
  }

}
