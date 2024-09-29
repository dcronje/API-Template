import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import ImageResolvers from '@GQLtypes/Image/ImageResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const imageResolvers = new ImageResolvers()
imageResolvers.register(registry, permissionRegistry)
