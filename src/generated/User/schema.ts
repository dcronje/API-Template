import { APIRegistry } from '@simple/api-registry'
import UserSchema from '@GQLtypes/User/UserSchema'

const registry: APIRegistry = APIRegistry.shared()
const userSchema = new UserSchema()
userSchema.register(registry)
