import { GraphQLScalarType } from 'graphql'
import { GQLRegistry } from 'gql-registry'

const ExpiryMonthScalar = new GraphQLScalarType({
  name: 'ExpiryMonth',
  description: 'ExpiryMonth',
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
          var month = parseInt(ast.value.toString())
          if (month >= 1 && month <= 12) {
            return ast.value.toString()
          } else {
            throw new TypeError('Value of ' + ast.value.toString() + ' is not a valid month')
          }
        } catch (e) {
          throw new TypeError('Value of ExpiryMonth cannot be converted to numerical month')
        }
      default:
        throw new TypeError('Type ExpiryMonth must be a String value')
    }
  },
})

let registry = GQLRegistry.shared()
registry.registerType({
  typeResolvers: {
    ExpiryMonth: ExpiryMonthScalar,
  },
})