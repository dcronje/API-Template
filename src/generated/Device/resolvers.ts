import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import DeviceResolvers from '@GQLtypes/Device/DeviceResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const deviceResolvers = new DeviceResolvers()
deviceResolvers.register(registry, permissionRegistry)
