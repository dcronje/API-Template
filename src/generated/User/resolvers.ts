import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserResolvers from '@GQLtypes/User/UserResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userResolvers = new UserResolvers()
userResolvers.register(registry, permissionRegistry)
