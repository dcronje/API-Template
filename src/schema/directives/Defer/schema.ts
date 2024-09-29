import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const directiveDefinition = gql`
  directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT
`

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
