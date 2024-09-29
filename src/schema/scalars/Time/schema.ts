import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  scalar Time
`

const registry = GQLRegistry.shared()
registry.registerType({
  typeDefinitions,
})
