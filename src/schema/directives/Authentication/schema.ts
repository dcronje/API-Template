import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const directiveDefinition = gql`
  directive @Permissions(types: [String]!) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION | OBJECT
  directive @isAuthenticated on OBJECT | FIELD_DEFINITION
`

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
