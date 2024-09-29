import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import ImageResolvers from '@GQLtypes/Image/ImageResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const imageResolvers = new ImageResolvers()
imageResolvers.register(registry, permissionRegistry)
