import { buildSchema } from './schema'
import { buildResolvers } from './resolvers'

export default async function () {
  await buildSchema()
  await buildResolvers()
}
