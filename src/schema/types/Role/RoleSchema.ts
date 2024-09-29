import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

class RoleSchema {

  register(registry: APIRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
      mutationDefinitions: this.mutationDefinitions,
    })
  }

  typeDefinitions = gql`
    """Represents a Role in the system"""
    type Role {
      """The Role's ID"""
      id: ID!
      name: String!
      description: String
      permissions: [Permission]
      users: [UserRole]
      """The creation date of the Role"""
      createdAt: DateTime
      """The update date of the Role"""
      updatedAt: DateTime
    }
  
    """Fields available to order Properties"""
    enum RoleOrderEnum {
      "Name"
      NAME
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }
  
    """Role filtering options"""
    input RoleFilters {
      search: String
      id: ID
      ids: [ID!]
      minCreatedAt: DateTime
      maxCreatedAt: DateTime
      createdAt: DateTime
      minUpdatedAt: DateTime
      maxUpdatedAt: DateTime
      updatedAt: DateTime
    }
  
    """Role ordering options"""
    input RoleOrder {
      """Order field"""
      field: RoleOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }
  
    """Properties list object"""
    type RoleList {
      """A list of Properties"""
      list: [Role]!
      """A count of Properties"""
      count: Int!
      """Number of Role records skipped"""
      skip: Int!
      """Number of Role records returned"""
      limit: Int!
    }
  
    """Fields to add a new Role"""
    input AddRoleInput {
      name: String!
      description: String
      permissions: [String]
    }
  
    """Fields to update an existing Role"""
    input UpdateRoleInput {
      name: String
      description: String
      permissions: [String]
      updatedAt: DateTime
    }

  `

  queryDefinitions = gql`
    type Query { 
            
      """Get a list of Role with order and filtering options"""
      allRoles(skip: Int, limit: Int, filters: RoleFilters, order: [RoleOrder]): RoleList!
      
      """Get a specific Role by ID"""
      oneRole(id: ID!): Role!
      
      """Get a count of Role with filtering options"""
      countRoles(filters: RoleFilters): Int!
      
    } 
  `

  mutationDefinitions = gql`
    type Mutation { 
            
      """Add a new Role"""
      addRole(input: AddRoleInput!): Role! @Permissions(types: ["SUPER_ADMIN"])
      
      """Update an existing Role"""
      updateRole(id: ID!, input: UpdateRoleInput!): Role! @Permissions(types: ["SUPER_ADMIN"])
      
      """Delete a Role"""
      removeRole(id: ID!): ID! @Permissions(types: ["ADMIN"])
      
      "Give a Role a permission"
      assignPermission(id: ID!, permissionId: ID!): Boolean! @Permissions(types: ["SUPER_ADMIN"])
      
      "Remove a permission from a role"
      unassignPermission(id: ID!, permissionId: ID!): Boolean! @Permissions(types: ["SUPER_ADMIN"])
      
    } 
  `

}

export default RoleSchema
