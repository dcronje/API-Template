import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const PasswordScalar = new GraphQLScalarType({
  name: 'Password',
  description: 'Password',
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
        throw new TypeError('Password JWT must be a String value')
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    Password: PasswordScalar,
  },
})
