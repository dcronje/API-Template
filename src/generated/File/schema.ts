import { GQLRegistry } from 'gql-registry'
import FileSchema from '@GQLtypes/File/FileSchema'

const registry: GQLRegistry = GQLRegistry.shared()
const fileSchema = new FileSchema()
fileSchema.register(registry)
