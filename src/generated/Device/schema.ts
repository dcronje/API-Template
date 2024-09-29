import { APIRegistry } from '@simple/api-registry'
import DeviceSchema from '@GQLtypes/Device/DeviceSchema'

const registry: APIRegistry = APIRegistry.shared()
const deviceSchema = new DeviceSchema()
deviceSchema.register(registry)
