import { GQLRegistry } from 'gql-registry'
import FileCategorySchema from '@GQLtypes/FileCategory/FileCategorySchema'

const registry: GQLRegistry = GQLRegistry.shared()
const fileCategorySchema = new FileCategorySchema()
fileCategorySchema.register(registry)
