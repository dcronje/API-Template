import { APIRegistry } from '@simple/api-registry'
import RoleSchema from '@GQLtypes/Role/RoleSchema'

const registry: APIRegistry = APIRegistry.shared()
const roleSchema = new RoleSchema()
roleSchema.register(registry)
