import moment from 'moment'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { GraphQLError } from 'graphql/error'
import { GQLRegistry } from 'gql-registry'

let DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: function serialize(value: any) {
    if (!moment(value).isValid()) {
      throw new TypeError('Field error: value is not an instance of DateTime')
    }
    return moment(value).format()
  },
  parseValue: function parseValue(value: any) {
    if (typeof value !== 'string') {
      throw new TypeError('Field error: value is not an instance of string')
    }
    if (!moment(value).isValid()) {
      throw new TypeError('Field error: value is not an instance of DateTime')
    }
    return moment(value).toDate()
  },
  parseLiteral: function parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: Can only parse strings to DateTimes but got a: ' + ast.kind, { extensions: { nodes: [ast] } })
    }
    try {
      if (!moment(ast.value).isValid()) {
        throw new TypeError('Field error: value is not an instance of DateTime')
      }
      return moment(ast.value).toDate()
    } catch (e: any) {
      throw new GraphQLError('Query error: ' + e.message, { extensions: { nodes: [ast] } })
    }
  },
})

const registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    DateTime: DateTimeScalar,
  },
})
