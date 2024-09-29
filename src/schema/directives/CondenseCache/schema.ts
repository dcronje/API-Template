import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'


const directiveDefinition = gql`
  directive @condenseCache on QUERY
`

const registry = GQLRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
