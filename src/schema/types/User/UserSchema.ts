import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

class UserSchema {

  register(registry: APIRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
    })
  }

  typeDefinitions = gql`

    "A Users Title"
    enum TitleEnum {
      "Mr"
      MR
      "Ms"
      MS
      "Mrs"
      MRS
    }

    "Represents a User in the system"
    interface User @NoCache {
      "The User's ID"
      id: ID!
      title: TitleEnum
      firstName: String!
      lastName: String!
      name: String!
      email: Email!
      emailIsVerified: Boolean
      userDevices: [UserDevice]
      userRoles: [UserRole]
      currentDevice: Device
      "The creation date of the User"
      createdAt: DateTime
      "The update date of the User"
      updatedAt: DateTime
    }
  
    "Fields available to order Properties"
    enum UserOrderEnum {
      "First Name"
      FIRST_NAME  
      "Last Name"                                                 
      LAST_NAME
      "Name"
      NAME
      EMAIL
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }
  
    "User filtering options"
    input UserFilters {
      id: ID
      ids: [ID!]
      search: String
      minCreatedAt: DateTime
      maxCreatedAt: DateTime
      createdAt: DateTime
      minUpdatedAt: DateTime
      maxUpdatedAt: DateTime
      updatedAt: DateTime
      hasAcceptedInvite: Boolean
      isInvited: Boolean
    }
  
    "User ordering options"
    input UserOrder {
      "Order field"
      field: UserOrderEnum!
      "Order direction"
      direction: OrderDirectionEnum!
    }

    "Properties list object"
    type UserList {
      "A list of Properties"
      list: [User]!
      "A count of Properties"
      count: Int!
      "Number of User records skipped"
      skip: Int!
      "Number of User records returned"
      limit: Int!
    }

  `

  queryDefinitions = gql`
    type Query { 
            
      "Get a list of User with order and filtering options"
      allUsers(skip: Int, limit: Int, filters: UserFilters, order: [UserOrder]): UserList! @Permissions(types: ["SUPER_ADMIN"])
      
      "Get a specific User by ID"
      oneUser(id: ID!): User! @Permissions(types: ["SUPER_ADMIN", "USER_READ_OWNED"])
      
      "Get a count of User with filtering options"
      countUsers(filters: UserFilters): Int! @Permissions(types: ["SUPER_ADMIN"])
      
      "Validate User Invite"
      validateInvite(token: JWT): User
    } 
  `

}

export default UserSchema
