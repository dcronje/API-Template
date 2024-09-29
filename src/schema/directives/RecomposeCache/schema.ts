import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'


const directiveDefinition = gql`
  directive @recomposeCache on QUERY
`

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
