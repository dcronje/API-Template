import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  scalar ExpiryYear
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions,
})
