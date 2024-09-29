import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  type ClientInterfaceType {
    name: String!
  }
  type ClientInterface {
    kind: String!
    name: String!
    possibleTypes: [ClientInterfaceType]
  }
`
const queryDefinitions = gql`
  type Query {
    getInterfaceTypes: [ClientInterface]
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions,
  queryDefinitions,
})
