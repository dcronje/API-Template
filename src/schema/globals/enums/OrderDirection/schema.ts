import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const orderDirectionEnum = gql`
  enum OrderDirectionEnum {
    """Order Ascending"""
    ASC
    """Order Descending"""
    DESC
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions: orderDirectionEnum,
})
