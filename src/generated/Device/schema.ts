import { GQLRegistry } from 'gql-registry'
import DeviceSchema from '@GQLtypes/Device/DeviceSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const deviceSchema = new DeviceSchema()
deviceSchema.register(registry)
