import { APIRegistry } from '@simple/api-registry'
import PermissionSchema from '@GQLtypes/Permission/PermissionSchema'

const registry: APIRegistry = APIRegistry.shared()
const permissionSchema = new PermissionSchema()
permissionSchema.register(registry)
