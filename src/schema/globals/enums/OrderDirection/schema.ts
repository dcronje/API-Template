import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

const orderDirectionEnum = gql`
  enum OrderDirectionEnum {
    """Order Ascending"""
    ASC
    """Order Descending"""
    DESC
  }
`

const registry = GQLRegistry.shared()
registry.registerType({
  typeDefinitions: orderDirectionEnum,
})
