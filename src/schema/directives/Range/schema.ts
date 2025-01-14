import { GQLRegistry } from 'gql-registry'
import { gql } from 'graphql-tag'

const directiveDefinition = gql`
  directive @IntRange(min: Int, max: Int) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
`

const registry = GQLRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
