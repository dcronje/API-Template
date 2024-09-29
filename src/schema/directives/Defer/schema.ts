import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const directiveDefinition = gql`
  directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT
`

const registry = GQLRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
