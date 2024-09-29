import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

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

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    Phone: PhoneScalar,
  },
})
