import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import RoleResolvers from '@GQLtypes/Role/RoleResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const roleResolvers = new RoleResolvers()
roleResolvers.register(registry, permissionRegistry)
