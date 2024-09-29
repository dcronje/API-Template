import { GQLRegistry } from 'gql-registry'
import UserRoleSchema from '@GQLtypes/UserRole/UserRoleSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const userRoleSchema = new UserRoleSchema()
userRoleSchema.register(registry)
