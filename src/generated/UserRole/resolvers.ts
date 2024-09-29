import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserRoleResolvers from '@GQLtypes/UserRole/UserRoleResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userRoleResolvers = new UserRoleResolvers()
userRoleResolvers.register(registry, permissionRegistry)
