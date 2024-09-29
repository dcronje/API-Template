import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import DeviceResolvers from '@GQLtypes/Device/DeviceResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const deviceResolvers = new DeviceResolvers()
deviceResolvers.register(registry, permissionRegistry)
