import moment from 'moment'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { GraphQLError } from 'graphql/error'
import { APIRegistry } from '@simple/api-registry'

let DateScalar = new GraphQLScalarType({
  name: 'Date',
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

const registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    Date: DateScalar,
  },
})