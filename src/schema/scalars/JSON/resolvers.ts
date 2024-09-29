import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON',
  serialize(value: any) {
    return JSON.stringify(value)
  },
  parseValue(value: any) {
    return JSON.parse(value)
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case 'StringValue':
        return JSON.parse(ast.value)
      default:
        throw new TypeError('Type JSON must be a String value')
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
})
