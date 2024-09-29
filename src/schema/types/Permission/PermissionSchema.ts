import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

class PermissionSchema {

  register(registry: GQLRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
    })
  }

  typeDefinitions = gql`
    """The type of permission"""
    enum PermissionTypeEnum {
      """Static Permission (Specified in Code)"""
      STATIC_PERMISSION
      """Dynamic Permission (Specified in Schema)"""
      DYNAMIC_PERMISSION
    }

    """Represents a Permission in the system"""
    type Permission {
      """The Permission's ID"""
      id: ID!
      name: String!
      identifier: String!
      description: String!
      roles: [Role]
      isOwned: Boolean
      objectType: String
      """The creation date of the Model"""
      createdAt: DateTime
      """The update date of the Model"""
      updatedAt: DateTime
    }
  
    """Fields available to order Properties"""
    enum PermissionOrderEnum {
      "Name"
      NAME
      TYPE
      MODULE
      OBJECT_TYPE
    }
  
    """Permission filtering options"""
    input PermissionFilters {
      id: ID
      ids: [ID!]
      search: String
      types: [PermissionTypeEnum]
    }
  
    """Permission ordering options"""
    input PermissionOrder {
      """Order field"""
      field: PermissionOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }
  
    """Properties list object"""
    type PermissionList {
      """A list of Properties"""
      list: [Permission]!
      """A count of Properties"""
      count: Int!
      """Number of Permission records skipped"""
      skip: Int!
      """Number of Permission records returned"""
      limit: Int!
    }

  `

  queryDefinitions = gql`
    
    type Query {
      """Get a list of Permissions with order and filtering options"""
      allPermissions(skip: Int, limit: Int, filters: PermissionFilters, order: [PermissionOrder]): PermissionList! @Permissions(types: ["ADMIN"])

      """Get a specific Permission by ID"""
      onePermission(id: ID!): Permission! @Permissions(types: ["ADMIN"])

      """Get a count of Permission with filtering options"""
      countPermissions(filters: PermissionFilters): Int! @Permissions(types: ["ADMIN"])
    }

  `

}

export default PermissionSchema
