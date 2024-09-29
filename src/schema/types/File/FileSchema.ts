import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

class FileSchema {

  register(registry: APIRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
    })
  }

  typeDefinitions = gql`
    input FileUploadInput {
      file: Upload!
      name: String!
      categories: [ID]
    }
    
    """Represents a File in the system"""
    interface File {
      """The File's ID"""
      id: ID!
      name: String!
      location: String!
      mimetype: String!
      extension: String!
      categories: [FileCategory]
      """The creation date of the Model"""
      createdAt: DateTime
      """The update date of the Model"""
      updatedAt: DateTime
    }

    """Fields available to order Properties"""
    enum FileOrderEnum {
      "Name"
      NAME
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }

    """File filtering options"""
    input FileFilters {
      search: String
      id: ID
      ids: [ID!]
      categories: [ID]
      minCreatedAt: DateTime
      maxCreatedAt: DateTime
      createdAt: DateTime
      minUpdatedAt: DateTime
      maxUpdatedAt: DateTime
      updatedAt: DateTime
    }

    """File ordering options"""
    input FileOrder {
      """Order field"""
      field: FileOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }

    """Properties list object"""
    type FileList {
      """A list of Properties"""
      list: [File]!
      """A count of Properties"""
      count: Int!
      """Number of File records skipped"""
      skip: Int!
      """Number of File records returned"""
      limit: Int!
    }

  `

  queryDefinitions = gql`
    type Query { 
            
      """Get a list of Files with order and filtering options"""
      allFiles(skip: Int, limit: Int, filters: FileFilters, order: [FileOrder]): FileList! @Permissions(types: ["ADMIN"])
      
      """Get a specific File by ID"""
      oneFile(id: ID!): File! @Permissions(types: ["ADMIN"])
      
      """Get a count of File with filtering options"""
      countFiles(filters: FileFilters): Int! @Permissions(types: ["ADMIN"])
      
    } 
  `

}

export default FileSchema
