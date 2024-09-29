import cluster from 'cluster'
import { Clusterer } from '@lib/Cluster'
import http from 'http'
import { GQLRegistry } from 'gql-registry'
import { performPostStartupChecks, performPreStartupChecks } from './startup'
import build from '@schema/index'
import { getApp } from '@apps/main.app'
import { AppDataSource } from './data-source'

const clusterer = new Clusterer({
  port: parseInt(process.env.PORT || '4000'),
  workers: parseInt(process.env.CORES || '4'),
  sticky: 'x-forwarded-for',
})

clusterer.preMaster(async () => {
  await performPreStartupChecks()
})

clusterer.postMaster(async () => {
  const apiRegistry = GQLRegistry.shared()
  await build()
  await performPostStartupChecks(apiRegistry)
  await AppDataSource.destroy()
})

clusterer.worker(async (): Promise<http.Server> => {
  await performPreStartupChecks()
  await build()
  const { server } = await getApp()
  server.on('listening', () => {
    console.log(`SERVER ${cluster.worker?.id} LISTENING`)
  })
  return server
})

clusterer.start()
