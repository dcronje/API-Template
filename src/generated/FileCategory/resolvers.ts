import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import FileCategoryResolvers from '@GQLtypes/FileCategory/FileCategoryResolvers'

const registry: APIRegistry = APIRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const fileCategoryResolvers = new FileCategoryResolvers()
fileCategoryResolvers.register(registry, permissionRegistry)
