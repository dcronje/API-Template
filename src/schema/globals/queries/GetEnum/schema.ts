import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const typeDefinitions = gql`
  type EnumValue {
    title: String!
    value: String!
  }

  type EnumDescription {
    name: String!
    description: String!
    values: [EnumValue]
  }

`

const queryDefinitions = gql`
  type Query {
    getEnums(enums: [String]!): [EnumDescription]
  
    getEnum(enum: String!): EnumDescription
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions,
  queryDefinitions,
})
