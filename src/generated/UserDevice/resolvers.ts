import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserDeviceResolvers from '@GQLtypes/UserDevice/UserDeviceResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const userDeviceResolvers = new UserDeviceResolvers()
userDeviceResolvers.register(registry, permissionRegistry)
