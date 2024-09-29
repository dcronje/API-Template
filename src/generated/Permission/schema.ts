import { GQLRegistry } from 'gql-registry'
import PermissionSchema from '@GQLtypes/Permission/PermissionSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const permissionSchema = new PermissionSchema()
permissionSchema.register(registry)
