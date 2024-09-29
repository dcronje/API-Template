import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const JWTScalar = new GraphQLScalarType({
  name: 'JWT',
  description: 'JWT',
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
        throw new TypeError('Type JWT must be a String value')
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    JWT: JWTScalar,
  },
})
