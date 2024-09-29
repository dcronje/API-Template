import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import FileResolvers from '@GQLtypes/File/FileResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const fileResolvers = new FileResolvers()
fileResolvers.register(registry, permissionRegistry)
