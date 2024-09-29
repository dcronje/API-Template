import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  scalar ID
`

const registry = GQLRegistry.shared()
registry.registerType({
  typeDefinitions,
})
