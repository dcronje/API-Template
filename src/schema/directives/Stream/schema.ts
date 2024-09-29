import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const directiveDefinition = gql`
  directive @stream(if: Boolean, label: String, initialCount: Int = 0) on FIELD
`

const registry = GQLRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
