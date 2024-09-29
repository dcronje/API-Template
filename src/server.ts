
import './env'
import 'reflect-metadata'
import './crons'
import build from './schema/'
import { GQLRegistry } from 'gql-registry'
import { performPreStartupChecks, performPostStartupChecks } from './startup'
import { getApp } from '@apps/main.app'
import chalk from 'chalk'
import notifier from 'node-notifier'

const start = async () => {
  const registry: GQLRegistry = GQLRegistry.shared()
  await performPreStartupChecks()
  await build()
  const { server } = await getApp()
  server.once('listening', function () {
    console.log(`🚀 Apollo Server ready at ${chalk.underline(`${process.env.PROTOCOL}://${process.env.DOMAIN}:${process.env.PORT}`)}`)
    if (process.env.NODE_ENV === 'development') {
      notifier.notify({
        title: 'API',
        message: '🚀 Apollo Server ready',
        sound: true,
      })
    }
  })
  server.listen(parseInt(process.env.PORT || '4000'))
  await performPostStartupChecks(registry)
}

start()
