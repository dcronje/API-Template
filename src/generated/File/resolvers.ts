import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import FileResolvers from '@GQLtypes/File/FileResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const fileResolvers = new FileResolvers()
fileResolvers.register(registry, permissionRegistry)
