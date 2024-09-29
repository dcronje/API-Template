import { User } from '@root/types/generated'
import { APIRegistry } from '@simple/api-registry'

const queryResolvers = {
  currentUser: (_: unknown, __: unknown, ctx: GQLContext): User | null => {
    return ctx.user as unknown as User | null
  },
}

const registry = APIRegistry.shared()
registry.registerType({
  queryResolvers,
})
