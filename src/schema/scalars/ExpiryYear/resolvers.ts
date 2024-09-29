import { GraphQLScalarType } from 'graphql'
import { APIRegistry } from '@simple/api-registry'
import moment = require('moment');

const ExpiryYearScalar = new GraphQLScalarType({
  name: 'ExpiryYear',
  description: 'ExpiryYear',
  serialize(value: any) {
    return value.toString()
  },
  parseValue(value: any) {
    return value.toString()
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case 'StringValue':
        try {
          var year = parseInt(ast.value.toString())
          if (year >= moment().get('year')) {
            return ast.value.toString()
          } else {
            throw new YearConversionError('Value of ' + ast.value.toString() + ' is not a valid year or is in the past')
          }
        } catch (e) {
          if (e instanceof YearConversionError) {
            throw new TypeError(e.message)
          } else {
            throw new TypeError('Value of ExpiryYear cannot be converted to numerical year')
          }
        }
      default:
        throw new TypeError('Type ExpiryYear must be a String value')
    }
  },
})

class YearConversionError extends TypeError {
  constructor(public message: string) {
    super();
  }
}

let registry = APIRegistry.shared()
registry.registerType({
  typeResolvers: {
    ExpiryYear: ExpiryYearScalar,
  },
})