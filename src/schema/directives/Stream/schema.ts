import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const directiveDefinition = gql`
  directive @stream(if: Boolean, label: String, initialCount: Int = 0) on FIELD
`

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
