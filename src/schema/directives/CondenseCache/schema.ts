import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'


const directiveDefinition = gql`
  directive @condenseCache on QUERY
`

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveDefinition,
})
