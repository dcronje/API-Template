import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const queryDefinitions = gql`
  type Query {
    getInputObjectConfig(name: String!): JSON
    getDetailedInputObjectConfig(name: String!): JSON
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  queryDefinitions,
})
