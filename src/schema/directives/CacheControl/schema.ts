import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }
`

const directiveDefinition = gql`
  directive @CacheControl (
    maxAge: Int
    scope: CacheControlScope
  ) on FIELD_DEFINITION | OBJECT | INTERFACE
  directive @NoCache on FIELD_DEFINITION | OBJECT | INTERFACE
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions,
})
registry.registerDirectives({
  directiveDefinition,
})
