import { APIRegistry } from '@simple/api-registry'
import UserDeviceSchema from '@GQLtypes/UserDevice/UserDeviceSchema'

const registry: APIRegistry = APIRegistry.shared()
const userDeviceSchema = new UserDeviceSchema()
userDeviceSchema.register(registry)
