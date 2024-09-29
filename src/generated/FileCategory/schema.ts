import { APIRegistry } from '@simple/api-registry'
import FileCategorySchema from '@GQLtypes/FileCategory/FileCategorySchema'

const registry: APIRegistry = APIRegistry.shared()
const fileCategorySchema = new FileCategorySchema()
fileCategorySchema.register(registry)
