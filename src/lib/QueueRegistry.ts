import Bull from 'bull'
import os from 'os'
import cluster, { Worker } from 'cluster'
import chalk from 'chalk'

const DEFAULT_CLEANUP_TIME = 1000 * 60 * 60 * 24 * 2
const READY_MESSAGE = 'WORKER_READY_FOR_CONFIG'
const CORE_STARTUP_INTERVAL = 500
const cpuCount = process.env.QUEUE_CORES ? parseInt(process.env.QUEUE_CORES) : os.cpus().length

export enum QueueType {
  PROCESS = 'PROCESS',
  TIMED = 'TIMED'
}

interface QueueItem {
  type: QueueType
  processes?: number
  interval?: number
  cron?: string
  queue: Bull.Queue
  priority: number
  cleanupInterval: number
  reserveCore: boolean
  active: boolean
  lockToCore?: number
  startProcess: (threads?: number) => void
}

export interface WorkerConfig {
  queue: string
  count: number
}

interface QueueConfig {
  name: string
  priority: number
  cores: number[]
}

interface RegisterTimedQueueArgs<T> {
  queue: Bull.Queue<T>
  interval?: number
  cron?: string
  priority?: number
  cleanupInterval?: number
  reserveCore?: boolean
  active?: boolean
  lockToCore?: number
  startProcess: () => void
}

interface RegisterProcessQueueArgs<T> {
  queue: Bull.Queue<T>
  processes: number
  priority?: number
  cleanupInterval?: number
  reserveCore?: boolean
  active?: boolean
  lockToCore?: number
  startProcess: (threads?: number) => void
}

class QueueRegistry {

  queues: { [k: string]: QueueItem } = {}
  coreQueues: WorkerConfig[][] = []
  workers: Worker[] = []
  queueReservedCores: number[] = []
  numberOfReservedCores = 0

  /**
   * Get the Shared Registry
   *
   * @return  {QueueRegistry}  QueueRegistry Object
   */
  static shared(): QueueRegistry {
    if (!instance) {
      instance = new QueueRegistry()
    }
    return instance
  }

  /**
   * Construct the Queue Registry
   *
   * @return  {QueueRegistry}  QueueRegistry Object
   */
  constructor() {
    this.addCleanupQueue()
  }

  /**
   * Get the Redis URL from env variables
   *
   * @return  {string}  The Redis URL
   */
  static redisUrl(): string {
    const host = process.env.REDIS_QUEUE_HOST || '[::]'
    const port = process.env.REDIS_QUEUE_PORT || '6379'
    const db = process.env.REDIS_QUEUE_DB || 2
    return `redis://${host}:${port}/${db}`
  }

  /**
   * Wait method for setting a time out using async await
   *
   * @param   {number<void>}   interval  the duration to wai
   *
   * @return  {Promise<void>}            no return
   */
  static async wait(interval: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, interval)
    })
  }

  /**
   * Retry helper function for initialising queues
   *
   * @param   {Promise<void>}  execFunction  the fuction to execute
   * @param   {number}  timeout  time betwen executions if an error is thrown
   * @param   {number}  attempts  number of attempts to call the function
   *
   * @return  {Promise<void>}  no return
   */
  static async retry(execFunction: () => Promise<void>, timeout = 1000, attempts = 5): Promise<void> {
    let tries = 0
    while (tries < attempts) {
      try {
        await execFunction()
        break
      } catch (e: any) {
        console.log(e.stack)
        console.log(chalk.red('RETRYING!!'))
        tries++
        this.wait(timeout)
      }
    }
  }

  /**
   * Register a process queue for processing tasks in the background
   *
   * @param   {RegisterProcessQueueArgs<T>}  args   Parameters for the queue
   *
   * @return  {(args: T, delay?: number) => Promise<void>}  A function to queue a task
   */
  public registerProcessQueue<T>(args: RegisterProcessQueueArgs<T>): (args: T, delay?: number) => Promise<string> {
    const { queue, processes, priority = 1, cleanupInterval = DEFAULT_CLEANUP_TIME, reserveCore = false, active = true, lockToCore, startProcess } = args
    this.queues[queue.name] = { queue, processes, priority, cleanupInterval, startProcess, reserveCore, active, lockToCore, type: QueueType.PROCESS }
    return async (args: T, delay?: number): Promise<string> => {
      const job = await queue.add(args, { priority, delay })
      return job.id + ''
    }
  }

  /**
   * Register a process queue to repeat tasks in the background
   *
   * @param   {RegisterTimedQueueArgs<T>}  args  Parameters for the queue
   *
   * @return  {<void>} no return
   */
  public registerTimedQueue<T>(args: RegisterTimedQueueArgs<T>): void {
    const { queue, interval = 30, cron, priority = 1, cleanupInterval = DEFAULT_CLEANUP_TIME, reserveCore = false, active = true, lockToCore, startProcess } = args
    if (cron) {
      this.queues[queue.name] = { queue, cron, priority, cleanupInterval, startProcess, reserveCore, active, lockToCore, type: QueueType.TIMED }
    } else {
      this.queues[queue.name] = { queue, interval, priority, cleanupInterval, startProcess, reserveCore, active, lockToCore, type: QueueType.TIMED }
    }
  }

  /**
   * Add the internal cleanup queue
   *
   * @return  {<void>}  no return
   */
  private addCleanupQueue(): void {
    const queue = new Bull<null>('Queue Cleanup Queue', QueueRegistry.redisUrl())
    const startProcess = (): void => {
      queue.process(async (job): Promise<void> => {
        for (let q = 0; q < Object.keys(this.queues).length; q++) {
          console.log(`CLEANING UP ${Object.keys(this.queues)[q]}: WITH INTERVAL: ${this.queues[Object.keys(this.queues)[q]].cleanupInterval}`)
          await job.progress((100 / Object.keys(this.queues).length) * q)
          await this.queues[Object.keys(this.queues)[q]].queue.clean(this.queues[Object.keys(this.queues)[q]].cleanupInterval)
        }
        await job.progress(100)
      })
    }
    this.queues[queue.name] = {
      queue,
      cron: '0 8 * * *',
      priority: this.getMinPriority(),
      startProcess,
      cleanupInterval: 60,
      reserveCore: false,
      active: true,
      type: QueueType.TIMED,
    }
  }

  /**
   * Get the least important possible priority
   *
   * @return  {number}  The least important priority
   */
  private getMinPriority(): number {
    return 100
  }

  /**
   * Gets the configuration of individual queues
   *
   * @return  {QueueConfig[]} an array of QueueConfig objects
   */
  public getConfig(): QueueConfig[] {
    const queues: QueueConfig[] = []
    for (let c = 0; c < this.coreQueues.length; c++) {
      for (let q = 0; q < this.coreQueues[c].length; q++) {
        const queue = queues.find((queue) => queue.name === this.coreQueues[c][q].queue)
        const queueItem = this.getQueueItem(this.coreQueues[c][q].queue)
        if (queueItem.active) {
          const priority = queueItem.priority
          if (queue) {
            for (let n = 0; n < this.coreQueues[c][q].count; n++) {
              queue.cores.push((c + 1))
            }
          } else {
            const queue: QueueConfig = {
              name: this.coreQueues[c][q].queue,
              cores: [],
              priority,
            }
            for (let n = 0; n < this.coreQueues[c][q].count; n++) {
              queue.cores.push((c + 1))
            }
            queues.push(queue)
          }
        }
      }
    }
    for (let q = 0; q < queues.length; q++) {
      queues[q].cores.sort((a, b) => a > b ? 1 : -1)
    }
    queues.sort((a, b) => a.priority > b.priority ? 1 : -1)
    return queues
  }

  /**
   * Log the config to the console
   *
   * @return  {void}    no return
   */
  private logConfig(): void {
    // cluster?.worker?.id
    const config = this.getConfig()
    const processCount = config.reduce((total, conf) => total + conf.cores.length, 0)
    console.log(`\n\n******************* ${chalk.blue('QUEUES STARTED')} *******************\n`)
    console.log(`${chalk.yellow(`${config.length}`)} Queues, running on ${chalk.green(`${cpuCount}`)} CPU cores, spawning ${chalk.red(`${processCount}`)} processes!`)
    console.log('\n                      **********                      \n')
    config.forEach((conf) => {
      console.log(`Queue: ${chalk.yellow(conf.name)} `)
      const queueItem = this.getQueueItem(conf.name)
      const reservedMessage = queueItem.reserveCore ? chalk.red(' * RESERVES CORE *') : ''
      console.log(`      Priority ${chalk.red(`${conf.priority}`)} Running On Cores: ${chalk.green(conf.cores.join(', '))}${reservedMessage}\n`)
    })
    console.log(`\n************** ${chalk.red('SKIPPING INACTIVE QUEUES')} **************\n`)
    const queues: QueueItem[] = Object.keys(this.queues).map((queue) => {
      return this.queues[queue]
    })
    const inactiveQueues = queues.filter((queue) => !queue.active)
    for (let i = 0; i < inactiveQueues.length; i++) {
      console.log(chalk.magenta(inactiveQueues[i].queue.name))
    }
    console.log('\n******************************************************\n\n')
  }

  /**
   * Log the config of a single core to console
   *
   * @param   {number}  coreId  the id of the core
   *
   * @return  {void}            [return description]
   */
  private logCore(config: WorkerConfig[], coreId: number): void {
    const core = (coreId + '').padEnd(2)
    console.log(`\n\n****************** ${chalk.blue('STARTING CORE ')} ${chalk.green(core)} *****************\n`)
    console.log('Active Queues on Core:')
    const coreQueues = config.sort((a, b) => {
      const aQueueItem = this.getQueueItem(a.queue)
      const bQueueItem = this.getQueueItem(b.queue)
      return aQueueItem.priority > bQueueItem.priority ? 1 : -1
    })
    for (let c = 0; c < coreQueues.length; c++) {
      console.log(`      ${(coreQueues[c].count + '').padEnd(3)} x ${coreQueues[c].queue}`)
    }
    console.log('\n******************************************************\n\n')
  }

  /**
   * Get a list of Bull queue objects
   *
   * @return {Queue[]} An array of Bull Queue Objects
   */
  public getQueues(): Bull.Queue[] {
    const queues: QueueItem[] = []
    for (let q = 0; q < Object.keys(this.queues).length; q++) {
      if (this.queues[Object.keys(this.queues)[q]].active) {
        queues.push(this.queues[Object.keys(this.queues)[q]])
      }
    }
    queues.sort((a, b) => a.priority > b.priority ? 1 : -1)
    return queues.map((queue) => queue.queue)
  }

  /**
   * Clear the core config
   *
   * @return  {Promise<void>} no return
   */
  private async clearCores(): Promise<void> {
    this.coreQueues = []
    for (let w = 0; w < this.workers.length; w++) {
      await this.workers[w].kill()
    }
    for (let c = 0; c < cpuCount - this.numberOfReservedCores; c++) {
      this.coreQueues.push([])
    }
  }

  /**
   * Add queue to a specific core config
   *
   * @param   {string}  queue  The Queue identifier
   * @param   {number}  index  The Core index
   *
   * @return  {void}           no return
   */
  private addQueueToCore(queue: string, index: number): void {
    const coreQueue = this.coreQueues[(index - 1)].find((coreQueue) => coreQueue.queue === queue)
    if (coreQueue) {
      coreQueue.count++
    } else {
      this.coreQueues[(index - 1)].push({ queue, count: 1 })
    }
  }

  /**
   * Get a queue item by its identifier
   *
   * @param   {string}     id  The queue identifier
   *
   * @return  {QueueItem}      The queue item
   */
  private getQueueItem(id: string): QueueItem {
    return this.queues[id]
  }

  public getQueue(id: string): Bull.Queue | null {
    return this.queues[id]?.queue || null
  }

  /**
   * Converts minuts to miliseconds
   *
   * @param   {number}  mins  Minutes
   *
   * @return  {number}        Miliseconds
   */
  private getMillisecondsForMinutes(mins: number): number {
    return mins * 60 * 1000
  }

  /**
   * Resume a queue which already exisist in Redis
   *
   * @var {Bull.Queue<T>} queue The queue to resume
   *
   * @return  {boolean}       indicates the queue existed
   */
  private async restartQueue<T>(queue: Bull.Queue<T>): Promise<boolean> {
    const count = await queue.getRepeatableCount()
    if (count) {
      await queue.resume()
      return true
    }
    return false
  }

  /**
   * get an array of core ids that are available
   *
   * @return  {<number>[]} the available cores
   */
  private getAvailableCores(): number[] {
    const cores: number[] = []
    for (let c = 0; c < cpuCount - this.numberOfReservedCores; c++) {
      if (this.queueReservedCores.indexOf((c + 1)) === -1) {
        cores.push((c + 1))
      }
    }
    return cores
  }

  /**
   * get a count of reserved cores
   *
   * @return  {number}  the count of cores
   */
  public getCountOfReservedCores(): number {
    return cpuCount - this.getAvailableCores().length
  }

  /**
   * get a count of available cores
   *
   * @return  {number}  the count of cores
   */
  public getCountOfAvailableCores(): number {
    return this.getAvailableCores().length
  }

  /**
   * Internally configure the queues for multi core processing
   *
   * @return  {Promise<void>} no return
   */
  private async configureQueues(): Promise<void> {
    await this.clearCores()

    const lockedCores: QueueItem[] = Object.keys(this.queues).filter((queue) => {
      return this.queues[queue].lockToCore
    })
      .map((queue) => {
        return this.queues[queue]
      })
    for (let l = 0; l < lockedCores.length; l++) {
      if (lockedCores[l].lockToCore as number > cpuCount - this.numberOfReservedCores) {
        throw new Error(`Cannot reserve core ${lockedCores[l].lockToCore} when only ${(cpuCount - this.numberOfReservedCores)} are available`)
      }
      lockedCores[l].reserveCore = false
      if (lockedCores[l].type === QueueType.PROCESS) {
        this.configureProcessQueue(lockedCores[l], lockedCores[l].lockToCore as number, true)
      } else {
        this.configureTimedQueue(lockedCores[l], lockedCores[l].lockToCore as number, true)
      }
    }

    const reservedQueues: QueueItem[] = Object.keys(this.queues).filter((queue) => {
      return this.queues[queue].reserveCore && !this.queues[queue].lockToCore
    })
      .map((queue) => {
        return this.queues[queue]
      })
    for (let r = 0; r < reservedQueues.length; r++) {
      reservedQueues[r].priority = 1
      if (reservedQueues[r].type === QueueType.PROCESS) {
        this.configureProcessQueue(reservedQueues[r], (r + 1), true)
      } else {
        this.configureTimedQueue(reservedQueues[r], (r + 1), true)
      }
    }

    const nonReservedQueues: QueueItem[] = Object.keys(this.queues).filter((queue) => {
      return !this.queues[queue].reserveCore && !this.queues[queue].lockToCore
    })
      .map((queue) => {
        return this.queues[queue]
      })
    const processQueues = nonReservedQueues.filter((queue) => queue.type === QueueType.PROCESS && queue.active)
    const timedQueues = nonReservedQueues.filter((queue) => queue.type === QueueType.TIMED && queue.active)
    let currentCore = 0
    const availableCores = this.getAvailableCores()
    for (let t = 0; t < timedQueues.length; t++) {
      this.addQueueToCore(timedQueues[t].queue.name, availableCores[currentCore])
      currentCore++
      if (currentCore === availableCores.length) {
        currentCore = 0
      }
    }
    for (let p = 0; p < processQueues.length; p++) {
      if (!processQueues[p].processes) {
        for (let c = 0; c < this.getCountOfAvailableCores(); c++) {
          this.addQueueToCore(processQueues[p].queue.name, availableCores[currentCore])
          currentCore++
          if (currentCore === availableCores.length) {
            currentCore = 0
          }
        }
      } else {
        const processes = processQueues[p].processes as number
        for (let c = 0; c < processes; c++) {
          this.addQueueToCore(processQueues[p].queue.name, availableCores[currentCore])
          currentCore++
          if (currentCore === availableCores.length) {
            currentCore = 0
          }
        }
      }
    }
    this.logConfig()
  }

  /**
   * configure a timed queue
   *
   * @param   {QueueItem}  queueItem  The queue item
   * @param   {number}     coreId     the core id
   * @param   {boolean}    reserved   indicates wether or not the ocre should br reserved for this queue
   *
   * @return  {void}                  no return
   */
  private configureTimedQueue(queueItem: QueueItem, coreId: number, reserved = false): void {
    if (reserved) {
      this.queueReservedCores.push(coreId)
    } else if (queueItem.lockToCore && !this.queueReservedCores.includes(coreId)) {
      this.queueReservedCores.push(coreId)
    }
    this.addQueueToCore(queueItem.queue.name, coreId)
  }

  /**
   * configure a process queue
   *
   * @param   {QueueItem}  queueItem  The queue item
   * @param   {number}     coreId     the core id
   * @param   {boolean}    reserved   indicates wether or not the ocre should br reserved for this queue
   *
   * @return  {void}                  no return
   */
  private configureProcessQueue(queueItem: QueueItem, coreId: number, reserved = false): void {
    if (reserved || queueItem.lockToCore) {
      if (reserved) {
        this.queueReservedCores.push(coreId)
      } else if (queueItem.lockToCore && !this.queueReservedCores.includes(coreId)) {
        this.queueReservedCores.push(coreId)
      }
      const count = queueItem.processes || 1
      for (let c = 0; c < count; c++) {
        this.addQueueToCore(queueItem.queue.name, coreId)
      }
    } else {
      this.addQueueToCore(queueItem.queue.name, coreId)
    }
  }

  /**
   * Configure the master process
   *
   * @return  {Promise<void>} No return
   */
  public async configureMaster(config: { reservedCores?: number } = {}): Promise<void> {
    const { reservedCores = 0 } = config
    this.numberOfReservedCores = reservedCores
    const queueReservedCores = this.getCountOfReservedCores()
    if (cpuCount - (reservedCores + queueReservedCores) <= 0) {
      throw new Error(`Cannot reserve all CPU cores, trying to reserve ${reservedCores} cores when only ${cpuCount} are available`)
    }
    if (cpuCount - (reservedCores + queueReservedCores) === 0) {
      console.warn('Warning: all CPU cores are reserved, this means only reserved processes will run')
    }
    await this.configureQueues()
    for (let i = 0; i < cpuCount - reservedCores; i++) {
      const worker = cluster.fork()
      this.workers.push(worker)
      worker.on('message', (message) => {
        if (message === READY_MESSAGE) {
          worker.send({ config: this.coreQueues[i] })
        }
      })
      worker.on('exit', (exitedWorker: Worker) => {
        const index = this.workers.indexOf(exitedWorker)
        const worker = cluster.fork()
        this.workers.splice(index, 1, worker)
        worker.on('message', (message) => {
          if (message === READY_MESSAGE) {
            worker.send({ config: this.coreQueues[i] })
          }
        })
      })
      if (CORE_STARTUP_INTERVAL) {
        await QueueRegistry.wait(CORE_STARTUP_INTERVAL)
      }
    }
  }

  /**
   * Signal the worker has configured all dependencies and is ready to receive Queue Config from the master process
   *
   * @return  {Promise<void>} no return
   */
  public async signalWorkerReadyForConfig(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (process.send) {
        process.send(READY_MESSAGE, resolve)
      } else {
        reject(new Error('Process send function not available'))
      }
    })
  }

  /**
   * Configure a worker process
   *
   * @param   {WorkerConfig[]}  config  The Configuration for the Worker
   *
   * @return  {Promise<void>} No Return
   */
  public async configureWorker(config: WorkerConfig[]): Promise<void> {
    this.logCore(config, cluster.worker?.id as number)
    for (let c = 0; c < config.length; c++) {
      const queueItem = this.getQueueItem(config[c].queue)
      const queue = queueItem.queue
      if (queueItem.type === QueueType.TIMED) {
        queueItem.startProcess()
        const exists = await this.restartQueue(queue)
        if (!exists) {
          if (queueItem.cron) {
            await queue.add({}, { priority: queueItem.priority, repeat: { cron: queueItem.cron } })
          } else {
            const processTime = queueItem.interval as number
            await queue.add({}, { priority: queueItem.priority, repeat: { every: this.getMillisecondsForMinutes(processTime) } })
          }
        }
      } else {
        queueItem.startProcess(config[c].count)
      }
    }
  }

}

let instance: QueueRegistry | null = null

export default QueueRegistry
