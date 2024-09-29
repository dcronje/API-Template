import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

class UserRoleSchema {

  register(registry: GQLRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
      mutationDefinitions: this.mutationDefinitions,
    })
  }

  typeDefinitions = gql`
    """Represents a UserRole in the system"""
    type UserRole {
      """The UserRole's ID"""
      id: ID!
      user: User!
      role: Role!
      """The creation date of the UserRole"""
      createdAt: DateTime
      """The update date of the UserRole"""
      updatedAt: DateTime
    }
  
    """Fields available to order Properties"""
    enum UserRoleOrderEnum {
      "Name"
      NAME
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }
  
    """UserRole filtering options"""
    input UserRoleFilters {
      search: String
      id: ID
      ids: [ID!]
      users: [ID!]
      roles: [ID!]
      minCreatedAt: DateTime
      maxCreatedAt: DateTime
      createdAt: DateTime
      minUpdatedAt: DateTime
      maxUpdatedAt: DateTime
      updatedAt: DateTime
    }
  
    """UserRole ordering options"""
    input UserRoleOrder {
      """Order field"""
      field: UserRoleOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }
  
    """Properties list object"""
    type UserRoleList {
      """A list of Properties"""
      list: [UserRole]!
      """A count of Properties"""
      count: Int!
      """Number of UserRole records skipped"""
      skip: Int!
      """Number of UserRole records returned"""
      limit: Int!
    }
  
    """Fields to add a new UserRole"""
    input AddUserRoleInput {
      user: ID!
      role: ID!
    }

    input UpdateUserRoleInput {
      user: ID!
      role: ID!
    }
  `

  queryDefinitions = gql`
    type Query { 
            
      """Get a list of UserRole with order and filtering options"""
      allUserRoles(skip: Int, limit: Int, filters: UserRoleFilters, order: [UserRoleOrder]): UserRoleList! @Permissions(types: ["SUPER_ADMIN"])
      
      """Get a specific UserRole by ID"""
      oneUserRole(id: ID!): UserRole! @Permissions(types: ["SUPER_ADMIN"])
      
      """Get a count of UserRole with filtering options"""
      countUserRoles(filters: UserRoleFilters): Int! @Permissions(types: ["SUPER_ADMIN"])
      
    } 
  `

  mutationDefinitions = gql`
    type Mutation { 
            
      """Add a new UserRole"""
      addUserRole(input: AddUserRoleInput!): UserRole! @Permissions(types: ["SUPER_ADMIN"])
      
      """Delete a UserRole"""
      removeUserRole(id: ID!): ID! @Permissions(types: ["SUPER_ADMIN"])
      
      """Update an existing UserRole - FAKE code gen method DO NOT USE """
      updateUserRole(id: ID!, input: UpdateUserRoleInput!): UserRole! @Permissions(types: ["SUPER_ADMIN"])
    } 
  `

}

export default UserRoleSchema
