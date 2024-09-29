import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import PermissionResolvers from '@GQLtypes/Permission/PermissionResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const permissionResolvers = new PermissionResolvers()
permissionResolvers.register(registry, permissionRegistry)
