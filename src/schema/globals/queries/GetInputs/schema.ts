import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const queryDefinitions = gql`
  type Query {
    getInputObjectConfig(name: String!): JSON
    getDetailedInputObjectConfig(name: String!): JSON
  }
`

const registry = GQLRegistry.shared()
registry.registerType({
  queryDefinitions,
})
