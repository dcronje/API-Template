import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserRoleResolvers from '@GQLtypes/UserRole/UserRoleResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userRoleResolvers = new UserRoleResolvers()
userRoleResolvers.register(registry, permissionRegistry)
