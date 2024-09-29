import { APIRegistry } from '@simple/api-registry'
import UserRoleSchema from '@GQLtypes/UserRole/UserRoleSchema'

const registry: APIRegistry = APIRegistry.shared()
const userRoleSchema = new UserRoleSchema()
userRoleSchema.register(registry)
