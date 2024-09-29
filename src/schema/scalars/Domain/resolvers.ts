import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const DomainScalar = new GraphQLScalarType({
  name: 'Domain',
  description: 'Domain',
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
        throw new TypeError('Type Domain must be a String value')
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    Domain: DomainScalar,
  },
})
