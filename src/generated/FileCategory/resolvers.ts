import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import FileCategoryResolvers from '@GQLtypes/FileCategory/FileCategoryResolvers'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
const fileCategoryResolvers = new FileCategoryResolvers()
fileCategoryResolvers.register(registry, permissionRegistry)
