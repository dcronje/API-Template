import { GQLRegistry } from 'gql-registry'
import UserSchema from '@GQLtypes/User/UserSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const userSchema = new UserSchema()
userSchema.register(registry)
