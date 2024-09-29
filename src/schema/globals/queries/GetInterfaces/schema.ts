import { GQLRegistry } from 'gql-registry'
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

const registry = GQLRegistry.shared()
registry.registerType({
  typeDefinitions,
  queryDefinitions,
})
