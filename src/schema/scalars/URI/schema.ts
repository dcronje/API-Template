import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  scalar URI
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions,
})
