import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserResolvers from '@GQLtypes/User/UserResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userResolvers = new UserResolvers()
userResolvers.register(registry, permissionRegistry)
