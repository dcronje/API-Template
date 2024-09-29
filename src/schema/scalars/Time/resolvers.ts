import moment from 'moment'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { GraphQLError } from 'graphql/error'
import { APIRegistry } from '@simple/api-registry'

let TimeScalar = new GraphQLScalarType({
  name: 'Time',
  description: 'An instance of time in HH:mm format',
  serialize(value: any) {
    if (!(moment(value, 'HH:mm'))) {
      throw new TypeError('Field error: value is not an instance of Time')
    }
    return value
  },
  parseValue(value: any) {
    if (typeof value !== 'string') {
      throw new TypeError('Field error: value is not an instance of string')
    }
    if (!(moment(value, 'HH:mm'))) {
      throw new TypeError('Field error: value is not an instance of Time')
    }
    return moment(value, 'HH:mm')
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: Can only parse strings to Times but got a: ' + ast.kind, { extensions: { nodes: [ast] } })
    }
    if (!(moment(ast.value, 'HH:mm'))) {
      throw new GraphQLError('Field error: value is not an instance of Time')
    }
    return moment(ast.value, 'HH:mm')
  },
})

const registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    Time: TimeScalar,
  }
})
