import { GQLRegistry } from 'gql-registry'
import ImageSchema from '@GQLtypes/Image/ImageSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const imageSchema = new ImageSchema()
imageSchema.register(registry)
