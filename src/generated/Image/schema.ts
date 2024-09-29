import { APIRegistry } from '@simple/api-registry'
import ImageSchema from '@GQLtypes/Image/ImageSchema'

const registry: APIRegistry = APIRegistry.shared()
const imageSchema = new ImageSchema()
imageSchema.register(registry)
