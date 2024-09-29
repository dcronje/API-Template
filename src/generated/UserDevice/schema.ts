import { GQLRegistry } from 'gql-registry'
import UserDeviceSchema from '@GQLtypes/UserDevice/UserDeviceSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const userDeviceSchema = new UserDeviceSchema()
userDeviceSchema.register(registry)
