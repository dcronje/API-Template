import { User } from '@root/types/generated'
import { GQLRegistry } from 'gql-registry'

const queryResolvers = {
  currentUser: (_: unknown, __: unknown, ctx: GQLContext): User | null => {
    return ctx.user as unknown as User | null
  },
}

const registry = GQLRegistry.shared()
registry.registerType({
  queryResolvers,
})
