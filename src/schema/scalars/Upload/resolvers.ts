import { GraphQLScalarType } from 'graphql'
import { APIRegistry } from '@simple/api-registry'

export const UploadScalar = new GraphQLScalarType({
  name: 'Upload',
  description: 'The `Upload` scalar type represents a file upload.',
  parseValue: value => value,

  parseLiteral() {
    throw new Error('‘Upload’ scalar literal unsupported.')
  },

  serialize() {
    throw new Error('‘Upload’ scalar serialization unsupported.')
  }
})

const registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    Upload: UploadScalar,
  },
})