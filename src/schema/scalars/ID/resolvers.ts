import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const IDScalar = new GraphQLScalarType({
  name: 'ID',
  description: 'ID for working with Postgres',
  serialize(value: any) {
    return value + ''
  },
  parseValue(value: any) {
    return value + ''
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case 'StringValue':
        return ast.value + ''
      default:
        throw new TypeError('Type ID must be a String value')
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    ID: IDScalar,
  },
})
