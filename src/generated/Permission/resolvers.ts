import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import PermissionResolvers from '@GQLtypes/Permission/PermissionResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const permissionResolvers = new PermissionResolvers()
permissionResolvers.register(registry, permissionRegistry)
