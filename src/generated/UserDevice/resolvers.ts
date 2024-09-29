import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserDeviceResolvers from '@GQLtypes/UserDevice/UserDeviceResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userDeviceResolvers = new UserDeviceResolvers()
userDeviceResolvers.register(registry, permissionRegistry)
