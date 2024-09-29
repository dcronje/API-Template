import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  scalar Email
`

const registry = GQLRegistry.shared()
registry.registerType({
  typeDefinitions,
})
