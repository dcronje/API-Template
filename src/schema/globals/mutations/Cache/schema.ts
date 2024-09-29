import { GQLRegistry } from 'gql-registry'
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

const apiRegistry = GQLRegistry.shared()
apiRegistry.registerType({
  typeDefinitions,
  mutationDefinitions,
})
