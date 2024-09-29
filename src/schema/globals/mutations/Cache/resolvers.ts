import { clearCacheKeys } from "@lib/CachePlugin"
import { APIRegistry } from "@simple/api-registry"


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


const apiRegistry = APIRegistry.shared()
apiRegistry.registerType({
  mutationResolvers,
})