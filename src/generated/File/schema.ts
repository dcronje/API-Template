import { APIRegistry } from '@simple/api-registry'
import FileSchema from '@GQLtypes/File/FileSchema'

const registry: APIRegistry = APIRegistry.shared()
const fileSchema = new FileSchema()
fileSchema.register(registry)
