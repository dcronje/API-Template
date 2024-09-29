import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const EmailScalar = new GraphQLScalarType({
  name: 'Email',
  description: 'Email Address',
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
        throw new TypeError('Type Email must be a String value')
    }
  },
})


const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    Email: EmailScalar,
  },
})
