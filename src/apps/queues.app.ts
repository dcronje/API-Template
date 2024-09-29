import '@queues/index'
import express from 'express'
import auth from 'basic-auth'
// @ts-ignore
import { createBullBoard } from 'bull-board'
// @ts-ignore
import { BullAdapter } from 'bull-board/bullAdapter'
import QueueRegistry from '@lib/QueueRegistry'

const queuesApp = express()
const queues = QueueRegistry.shared().getQueues()
const { router } = createBullBoard(queues.map((queue) => new BullAdapter(queue)))

queuesApp.use('/', (req, res, next) => {
  const admin = { name: 'admin@wms.co.za', password: 'Uc00kT3ch' }
  const user = auth(req)
  if (!user || !admin.name || admin.password !== user.pass) {
    res.set('WWW-Authenticate', 'Basic realm="example"')
    return res.status(401).send()
  }
  // @ts-ignore
  router(req, res, next)
})

export { queuesApp }
