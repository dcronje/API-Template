import 'reflect-metadata'
import './env'
import '@queues/index'
import path from 'path'
import notifier from 'node-notifier'
import cluster from 'cluster'
import QueueRegistry, { WorkerConfig } from '@lib/QueueRegistry'
import { AppDataSource } from './data-source'

const registry = QueueRegistry.shared()
const startQueues = async (): Promise<void> => {
  await AppDataSource.initialize()
  if (cluster.isPrimary) {
    await registry.configureMaster()
    if (process.env.NODE_ENV === 'development') {
      notifier.notify({
        title: 'WMS QUEUE',
        icon: path.resolve(__dirname, './.icons/wms.png'),
        message: '🚀 Bull Queue ready',
      })
    }
  } else {
    process.on('message', async (msg: { config: WorkerConfig[] }) => {
      await registry.configureWorker(msg.config)
    })
    await registry.signalWorkerReadyForConfig()
  }
}

startQueues()
