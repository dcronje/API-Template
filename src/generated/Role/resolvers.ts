import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import RoleResolvers from '@GQLtypes/Role/RoleResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const roleResolvers = new RoleResolvers()
roleResolvers.register(registry, permissionRegistry)
