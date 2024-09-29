import { GQLRegistry } from 'gql-registry'
import RoleSchema from '@GQLtypes/Role/RoleSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const roleSchema = new RoleSchema()
roleSchema.register(registry)
