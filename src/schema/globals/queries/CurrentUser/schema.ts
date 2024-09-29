import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const queryDefinitions = gql`
  type Query {
    currentUser: User
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  queryDefinitions,
})
