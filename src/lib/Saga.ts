import { RedisHelper } from '@lib/RedisHelper'
import { Utilities } from '@lib/Utilities'
import { Lock } from 'redlock'

interface LockKey {
  type: string
  id?: string
}

export class Saga<T, R> {

  id = Utilities.randomString(10)
  context: T
  unlocked: { type: string, id: string }[] = []
  validationFunctions: ((context: T, lock: (type: string, id?: string) => Promise<void>, abort: () => void) => Promise<T>)[] = []
  commitFuncions: ((context: T, functions: { abort: () => void, queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => void }) => Promise<T>)[] = []
  aggregationFuncion: ((context: T, wasAborted: boolean) => Promise<R>) | null = null
  rollbackFuncions: ((e: Error, context: T, functions: { queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => void }) => Promise<T>)[] = []
  queuedFunctions: ((locks: { type: string, id: string }[]) => Promise<void> | void)[] = []
  lockKeys: { [k: string]: Lock } = {}
  isAborted = false

  constructor(context: T, unlocked: { type: string, id: string }[] = []) {
    this.context = context
    this.unlocked = unlocked
  }

  private splitLockKey(key: string): { id: string, type: string } {

    const match = key.match(/^(.*?)-(.*?)$/)
    if (!match || match.length < 2) {
      throw new Error(`Failed to split lock key: ${key}`)
    }
    return {
      type: match[1],
      id: match[2],
    }

  }

  private async lock(type: string, id?: string): Promise<Lock | null> {

    const isUnlocked = this.unlocked.find((unlock) => {
      return unlock.type === type && unlock.id === id
    })
    if (isUnlocked) {
      return null
    }
    const key = `${type}-${id}`
    if (id && !this.lockKeys[key]) {
      const lock = await RedisHelper.lock(key)
      if (lock) {
        this.lockKeys[key] = lock
      }
      // console.log(`***** LOCKED: ${this.id} - ${key}`)
    }
    return null
  }

  private async release(type: string, id?: string): Promise<void> {
    const lockKey = `${type}-${id}`
    try {
      if (id && this.lockKeys[lockKey]) {
        if (this.lockKeys[lockKey]) {
          await this.lockKeys[lockKey]?.release()
          delete this.lockKeys[lockKey]
        }
      }
    } catch (e) {
      console.log(`Error releasing lock: ${lockKey}`)
    }
  }

  private async releaseAll(): Promise<void> {
    const locks = Object.keys(this.lockKeys)
    for (let l = 0; l < locks.length; l++) {
      try {
        const { type, id } = this.splitLockKey(locks[l])
        await this.release(type, id)
      } catch (e) { }
    }
  }

  validate(validationFunctions: (context: T, lock: (type: string, id?: string) => Promise<void>, abort: () => void) => Promise<T>): Saga<T, R> {
    this.validationFunctions.push(validationFunctions)
    return this
  }

  commit(commitFuncions: (context: T, functions: { abort: () => void, queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => void }) => Promise<T>): Saga<T, R> {
    this.commitFuncions.push(commitFuncions)
    return this
  }

  aggregate(aggregationFuncions: (context: T) => Promise<R>): Saga<T, R> {
    this.aggregationFuncion = aggregationFuncions
    return this
  }

  rollback(rollbackFuncions: (e: Error, context: T, functions: { queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => void }) => Promise<T>): Saga<T, R> {
    this.rollbackFuncions.push(rollbackFuncions)
    return this
  }

  async execute(locks: LockKey[] = []): Promise<R> {

    let context: T = this.context
    let result!: R
    try {
      // lock all objects
      for (let l = 0; l < locks.length; l++) {
        await this.lock(locks[l].type, locks[l].id)
      }
      // run all validations
      for (let v = 0; v < this.validationFunctions.length; v++) {
        if (!this.isAborted) {
          const result = await this.validationFunctions[v](
            context,
            async (type: string, id?: string): Promise<void> => {
              await this.lock(type, id)
            },
            () => {
              this.isAborted = true
            },
          )
          context = result
        }
      }
      // run all commit functions
      try {
        for (let c = 0; c < this.commitFuncions.length; c++) {
          if (!this.isAborted) {
            const result = await this.commitFuncions[c](context, {
              abort: () => {
                this.isAborted = true
              },
              queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => {
                this.queuedFunctions.push(queueFunction)
              },
            })
            context = result
          }
        }
        // run aggregation function
        if (this.aggregationFuncion) {
          result = await this.aggregationFuncion(context, this.isAborted)
        }
      } catch (e: any) {
        // run rollback functions
        for (let r = 0; r < this.rollbackFuncions.length; r++) {
          const result = await this.rollbackFuncions[r](e, context, {
            queue: (queueFunction: (locks: { type: string, id: string }[]) => Promise<void> | void) => {
              this.queuedFunctions.push(queueFunction)
            },
          })
          context = result
        }
      }
    } finally {
      try {
        const locks = Object.keys(this.lockKeys).map((lockKey) => {
          const { type, id } = this.splitLockKey(lockKey)
          return { type, id }
        })
        for (let q = 0; q < this.queuedFunctions.length; q++) {
          try {
            await this.queuedFunctions[q](locks)
          } catch (e) { }
        }
      } catch (e) {
        console.log(e)
      }
      await this.releaseAll()
      // run all queued functions
    }
    return result
  }

}
