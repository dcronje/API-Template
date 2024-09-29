import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

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

let registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    Color: ColorScalar,
  },
})