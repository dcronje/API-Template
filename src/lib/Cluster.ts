import http from 'http'
import cluster, { Worker } from 'cluster'
import net from 'net'
import { v4 } from 'uuid'
// @ts-ignore
import { HTTPParser } from 'http-parser-js'

class Socket extends net.Socket {
  uuid?: string;
}

export enum BalanceType {
  ROUND_ROBBIN = 'ROUND_ROBBIN',
  RANDOM = 'RANDOM',
  ACTIVE_CONNECTIONS = 'ACTIVE_CONNECTIONS',
}

interface Options {
  port: number
  workers: number
  balance?: BalanceType
  sticky?: string | boolean
  startupWaitIterations?: number
  startupWaitIterationPeriod?: number
}

enum MessageTypeEnum {
  REGISTER = 'CLUSTER_REGISTER_WORKER',
  READY = 'CLUSTER_WORKER_REAY',
  CONNECTION = 'CLUSTER_CONNECTION',
  STARTUP = 'CLUSTER_WORKER_STARTUP',
  SOCKET_CLOSE = 'CLUSTER_SOCKET_CLOSED'
}

interface MessageObject {
  id?: number
}

export class Clusterer {

  port!: number
  isRunning = true
  workerCount = 1
  connections: { connection: net.Socket, id: string, address: string, worker: number }[] = []
  server!: http.Server | net.Server
  serverFunction: (() => Promise<http.Server>) | undefined = undefined
  preMasterFunction: (() => void) | undefined = undefined
  postMasterFunction: (() => void) | undefined = undefined
  workers: { id: number, ready: boolean }[] = []
  balance!: BalanceType
  sticky?: string | boolean
  startupWaitIterations!: number
  startupWaitIterationPeriod!: number
  hasRunPostMaster: boolean = false
  workerAddresses: { [k: string]: number } = {}

  constructor({ port, workers, balance = BalanceType.RANDOM, sticky, startupWaitIterations = 30, startupWaitIterationPeriod = 1000 }: Options) {
    this.port = port
    this.balance = balance
    this.sticky = sticky
    this.workerCount = workers
    this.startupWaitIterations = startupWaitIterations
    this.startupWaitIterationPeriod = startupWaitIterationPeriod
  }

  async start(): Promise<void> {
    if (cluster.isMaster) {
      for (let n = 0; n < this.workerCount; n++) {
        this.createWorker(n)
      }
      this.startMaster(this.port)
    } else {
      this.startWorker()
    }
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  wait(duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), duration)
    })
  }

  createWorker(index: number): void {
    const worker = cluster.fork()
    worker.on('message', ([type, uuid]: [MessageTypeEnum, string]) => {
      const { id } = worker
      if (type === MessageTypeEnum.REGISTER) {
        console.log(`Worker registered: ${id}`)
        const currentIndex = this.workers.findIndex((item) => item.id === id)
        if (currentIndex !== -1) {
          this.workers[currentIndex].ready = false
        } else {
          this.workers.push({
            id: id!,
            ready: false
          })
        }
        const worker = cluster?.workers?.[id!]
        worker?.send([MessageTypeEnum.STARTUP])
      } else if (type === MessageTypeEnum.READY) {
        console.log(`Worker ready: ${id}`)
        const currentIndex = this.workers.findIndex((item) => item.id === id)
        if (currentIndex !== -1) {
          this.workers[currentIndex].ready = true
        } else {
          this.workers.push({
            id: id!,
            ready: true
          })
        }
        const readyWorkers = this.workers.filter((wor) => wor.ready).length
        if (readyWorkers === this.workerCount && this.postMasterFunction && !this.hasRunPostMaster) {
          this.hasRunPostMaster = true
          this.postMasterFunction()
        }
      } else if (type === MessageTypeEnum.SOCKET_CLOSE) {
        const connectionIndex = this.connections.findIndex((conn) => conn.id === uuid)
        if (connectionIndex !== -1) {
          this.connections.splice(connectionIndex, 1)
        }
      }
    })

    worker.on('exit', (code, signal) => {
      if (this.isRunning) {
        this.createWorker(index)
      }
    })
  }

  async getAddressForRequest(connection: Socket): Promise<{ address: string, chunks: Buffer[] }> {
    if (typeof this.sticky === 'string') {
      return new Promise<{ address: string, chunks: Buffer[] }>((resolve) => {
        // get address from headers
        var parser = new HTTPParser('REQUEST')
        parser.reinitialize(HTTPParser.REQUEST)
        var receivedChunks: Buffer[] = []
        function handler(buffer: Buffer) {
          receivedChunks.push(buffer)
          parser.execute(buffer, 0, buffer.length)
        }
        connection.on('data', handler)
        var detachedFromMaster = function () {
          connection.off('data', handler)
        }
        connection.resume()
        // @ts-ignore
        parser.onHeadersComplete = (req) => {
          parser.finish()
          connection.pause()
          let address = connection.remoteAddress || '::'
          for (var i = 0; i < req.headers.length; i += 2) {
            if (req.headers[i].toLowerCase() === this.sticky) {
              address = (req.headers[i + 1] || '').trim().split(',')[0].trim() || address
              break
            }
          }
          detachedFromMaster()
          resolve({ address, chunks: receivedChunks })
        };
      })
    } else {
      return { address: connection.remoteAddress || '::', chunks: [] }
    }
  }

  async getWorkerForRequest(address: string, attempt = 0): Promise<Worker | undefined> {
    if (attempt > this.startupWaitIterations) {
      return
    }

    if (this.sticky && this.workerAddresses[address]) {
      // check if already assigned
      const previousWorker = cluster?.workers?.[this.workerAddresses[address]]
      if (previousWorker) {
        return previousWorker
      } else {
        delete this.workerAddresses[address]
      }
    }

    const activeWorkers = this.workers.filter((worker) => worker.ready)
    if (!activeWorkers.length) {
      console.log('WAITING FOR ACTIVE WORKERS')
      await this.wait(this.startupWaitIterationPeriod)
      return this.getWorkerForRequest(address, (attempt + 1))
    }
    var index = 0
    if (this.balance === BalanceType.RANDOM) {
      index = this.randomInt(0, activeWorkers.length - 1)
    } else if (this.balance === BalanceType.ACTIVE_CONNECTIONS) {
      const connectionCount: { worker: number, count: number }[] = []
      this.connections.forEach((con) => {
        const item = connectionCount.find((itm) => itm.worker === con.worker)
        if (item) {
          item.count++
        } else {
          connectionCount.push({
            worker: con.worker,
            count: 1,
          })
        }
      })
      let least = connectionCount[0]
      for (let c = 0; c < connectionCount.length; c++) {
        if (connectionCount[c].count < least.count) {
          least = connectionCount[c]
        }
      }
      index = activeWorkers.findIndex((wrk) => wrk.id === least.worker)
    } else {
      index = this.connections.length % activeWorkers.length
    }
    if (this.sticky) {
      this.workerAddresses[address] = activeWorkers[index]?.id
    }
    return cluster?.workers?.[activeWorkers[index]?.id]!

  }

  async startMaster(port: number): Promise<void> {
    if (this.preMasterFunction) {
      await this.preMasterFunction()
    }

    this.server = net.createServer({ pauseOnConnect: true }, async (connection: Socket) => {
      const uuid = v4()
      const { address, chunks } = await this.getAddressForRequest(connection)
      const worker = await this.getWorkerForRequest(address)
      if (worker) {
        this.connections.push({
          address,
          connection,
          id: uuid,
          worker: worker.id,
        })
        worker.send([MessageTypeEnum.CONNECTION, uuid, Buffer.concat(chunks).toString('base64')], connection)
      } else {
        console.log('COULD NOT OBTAIN WORKER')
        connection.destroy()
      }
    })
    this.server.listen(port)

    process.once('SIGINT', () => {
      this.stopMaster()
    })

  }

  async stopMaster(): Promise<void> {
    console.log(`CLOSING SERVER`)
    this.isRunning = false
    await this.server?.close()
    await Promise.all(this.connections.map((con) => {
      console.log(`DESTROYING CONNECTION: ${con.id}`)
      return con.connection.destroy()
    }))
    await Promise.all(Object.values(cluster.workers!).map((worker) => {
      console.log(`DESTROYING WORKER: ${worker?.id}`)
      return worker?.kill()
    }))
  }

  async startWorker(): Promise<void> {
    process.on('message', ([type, uuid, chunks]: [MessageTypeEnum, string, string], connection: Socket) => {
      if (type === MessageTypeEnum.CONNECTION) {
        console.log(`Worker connection: ${cluster.worker?.id}`)
        connection.unshift(Buffer.from(chunks, 'base64'))
        this.server.emit('connection', connection)
        connection?.resume()
        connection.on('close', () => process.send?.([MessageTypeEnum.SOCKET_CLOSE, uuid]))
      } else if (type === MessageTypeEnum.STARTUP) {
        console.log(`Worker startup: ${cluster.worker?.id}`)
        this.startWorkerServer()
      }
    })
    process?.send?.([MessageTypeEnum.REGISTER])
  }

  async startWorkerServer(): Promise<void> {
    if (this.serverFunction) {
      this.server = await this.serverFunction()
      this.server.listen(0 /* start on random port */, 'localhost' /* accept conn from this host only */)
      this.server.once('listening', () => {
        console.log(`SERVER FOR: ${cluster.worker?.id} LISTENING`)
        process?.send?.([MessageTypeEnum.READY])
      })
    }

  }

  async worker(callback: () => Promise<http.Server>): Promise<void> {
    this.serverFunction = callback
  }

  async preMaster(callback: () => Promise<void>): Promise<void> {
    this.preMasterFunction = callback
  }

  async postMaster(callback: () => Promise<void>): Promise<void> {
    this.postMasterFunction = callback
  }

}