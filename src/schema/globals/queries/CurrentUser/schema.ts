import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const queryDefinitions = gql`
  type Query {
    currentUser: User
  }
`

const registry = GQLRegistry.shared()
registry.registerType({
  queryDefinitions,
})
