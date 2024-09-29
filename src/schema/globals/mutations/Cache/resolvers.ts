import { clearCacheKeys } from "@lib/CachePlugin"
import { GQLRegistry } from "gql-registry"


const mutationResolvers = {
  clearCacheKeys: async (_: unknown, args: { cacheKeys: { type: string, id?: string }[] }): Promise<boolean> => {
    await clearCacheKeys(args.cacheKeys)
    return true
  },
  clearAllCacheKeys: async (): Promise<boolean> => {
    await clearCacheKeys()
    return true
  }
}


const apiRegistry = GQLRegistry.shared()
apiRegistry.registerType({
  mutationResolvers,
})