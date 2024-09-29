import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  input CacheKeyInput {
    type: String!
    id: ID
  }
`

const mutationDefinitions = gql`
  type Mutation {
    clearCacheKeys(cacheKeys: [CacheKeyInput!]!): Boolean! @Permissions(types: ["SUPER_ADMIN"])
    clearAllCacheKeys: Boolean! @Permissions(types: ["SUPER_ADMIN"])
  }
`

const apiRegistry = APIRegistry.shared()
apiRegistry.registerType({
  typeDefinitions,
  mutationDefinitions,
})
