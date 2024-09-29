import { GraphQLScalarType } from 'graphql'
import { APIRegistry } from '@simple/api-registry'

const ColorScalar = new GraphQLScalarType({
  name: 'Color',
  description: 'Color',
  serialize(value: any) {
    return value.toString()
  },
  parseValue(value: any) {
    return value.toString()
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case 'StringValue':
        return ast.value.toString()
      default:
        throw new TypeError('Type Color must be a String value')
    }
  },
})

let registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    Color: ColorScalar,
  },
})