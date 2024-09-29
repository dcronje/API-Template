import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const apiScalarDataTypeEnum = gql`
  enum ApiScalarDataTypeEnum {
    """Integer"""
    INT
    """Float"""
    FLOAT
    """Double"""
    DOUBLE
    """Boolean"""
    BOOLEAN
    """Date"""
    DATE
    """Date Time"""
    DATE_TIME
    """Time"""
    TIME
    """Week"""
    WEEK
    """Month"""
    MONTH
    """Year"""
    YEAR
    """String"""
    STRING
    """Text"""
    TEXT
    """Hyper Text"""
    HYPERTEXT
    """Email"""
    EMAIL
    """Phone"""
    PHONE
    """Color"""
    COLOR
    """Link"""
    URI
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions: apiScalarDataTypeEnum,
})
