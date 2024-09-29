import { GraphQLScalarType } from 'graphql'
import { APIRegistry } from '@simple/api-registry'

const PhoneScalar = new GraphQLScalarType({
  name: 'Phone',
  description: 'Phone Number',
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
        throw new TypeError('Type Phone must be a String value')
    }
  },
})

const registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    Phone: PhoneScalar,
  },
})
