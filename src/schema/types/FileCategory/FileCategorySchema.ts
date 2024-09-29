import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

class FileCategorySchema {

  register(registry: GQLRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
      mutationDefinitions: this.mutationDefinitions,
    })
  }

  typeDefinitions = gql`
    """Represents a FileCategory in the system"""
    type FileCategory {
      """The FileCategory's ID"""
      id: ID!
      name: String!
      files: [File]
      """The creation date of the FileCategory"""
      createdAt: DateTime
      """The update date of the FileCategory"""
      updatedAt: DateTime
    }
  
    """Fields available to order Properties"""
    enum FileCategoryOrderEnum {
      "Name"
      NAME
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }
  
    """FileCategory filtering options"""
    input FileCategoryFilters {
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
  
    """FileCategory ordering options"""
    input FileCategoryOrder {
      """Order field"""
      field: FileCategoryOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }
  
    """Properties list object"""
    type FileCategoryList {
      """A list of Properties"""
      list: [FileCategory]!
      """A count of Properties"""
      count: Int!
      """Number of FileCategory records skipped"""
      skip: Int!
      """Number of FileCategory records returned"""
      limit: Int!
    }
  
    """Fields to add a new FileCategory"""
    input AddFileCategoryInput {
      name: String!
    }
  
    """Fields to update an existing FileCategory"""
    input UpdateFileCategoryInput {
      name: String
    }

  `

  queryDefinitions = gql`
    type Query { 
            
      """Get a list of FileCategory with order and filtering options"""
      allFileCategories(skip: Int, limit: Int, filters: FileCategoryFilters, order: [FileCategoryOrder]): FileCategoryList!
      
      """Get a specific FileCategory by ID"""
      oneFileCategory(id: ID!): FileCategory!
      
      """Get a count of FileCategory with filtering options"""
      countFileCategories(filters: FileCategoryFilters): Int!
      
    } 
  `

  mutationDefinitions = gql`
    type Mutation { 
            
      """Add a new FileCategory"""
      addFileCategory(input: AddFileCategoryInput!): FileCategory! @Permissions(types: ["ADMIN"])
      
      """Update an existing FileCategory"""
      updateFileCategory(id: ID!, input: UpdateFileCategoryInput!): FileCategory! @Permissions(types: ["ADMIN"])
      
      """Delete a FileCategory"""
      removeFileCategory(id: ID!): ID! @Permissions(types: ["ADMIN"])
      
    } 
  `

}

export default FileCategorySchema
