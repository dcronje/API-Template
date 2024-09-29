import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

class ImageSchema {

  register(registry: APIRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      queryDefinitions: this.queryDefinitions,
      mutationDefinitions: this.mutationDefinitions,
    })
  }

  typeDefinitions = gql`
    enum ImageScaleEnum {
      "Scale to Cover"
      COVER
      "Scale to Fit"
      FIT
      "Scale to Contain"
      CONTAIN
    }
    enum ImageEncodingEnum {
      "WebP"
      WEBP
      "PNG"
      PNG
      "JPEG"
      JPEG
      "SVG"
      SVG
    }
    enum ImageTransformTypeEnum {
      "Blur"
      BLUR
      "Gaussian Blur"
      GAUSSIAN_BLUR
      "Grey Scale"
      GREY_SCALE
      "Posterize"
      POSTERIZE
      "Sepia"
      SEPIA
      "Pixelate"
      PIXELATE
      "Opacity"
      OPACITY
      "CMYK Color Space"
      CMYK
    }
    input ImageTransform {
      type: ImageTransformTypeEnum!
      value: Float
    }
    type ImageInfo {
      type: String!
      width: Int!
      height: Int!
    }
    """Represents a Image in the system"""
    type Image implements File {
      """The Image's ID"""
      id: ID!
      name: String!
      alt: String!
      staticId: String
      location: String!
      mimetype: String!
      extension: String!
      encoding: ImageEncodingEnum!
      imageInfo: ImageInfo!
      categories: [FileCategory]
      hasTransparency: Boolean!
      isVector: Boolean!
      isDefault: Boolean!
      url(width: Int, height: Int, scale: ImageScaleEnum, transforms: [ImageTransform] encoding: ImageEncodingEnum): URI
      """The creation date of the Image"""
      createdAt: DateTime
      """The update date of the Image"""
      updatedAt: DateTime
    }
  
    """Fields available to order Properties"""
    enum ImageOrderEnum {
      "Name"
      NAME
      "Created At"
      CREATED_AT
      "Updated At"
      UPDATED_AT
    }
  
    """Image filtering options"""
    input ImageFilters {
      search: String
      id: ID
      ids: [ID!]
      categories: [ID]
      encoding: [ImageEncodingEnum!]
      minCreatedAt: DateTime
      maxCreatedAt: DateTime
      createdAt: DateTime
      minUpdatedAt: DateTime
      maxUpdatedAt: DateTime
      updatedAt: DateTime
    }
  
    """Image ordering options"""
    input ImageOrder {
      """Order field"""
      field: ImageOrderEnum
      """Order direction"""
      direction: OrderDirectionEnum
    }
  
    """Properties list object"""
    type ImageList {
      """A list of Properties"""
      list: [Image]!
      """A count of Properties"""
      count: Int!
      """Number of Image records skipped"""
      skip: Int!
      """Number of Image records returned"""
      limit: Int!
    }
  
    """Fields to add a new Image"""
    input AddImageInput {
      name: String!
      alt: String
      staticId: String
      file: Upload!
      categories: [ID]
      hasTransparency: Boolean
    }
  
    """Fields to update an existing Image"""
    input UpdateImageInput {
      name: String
      alt: String
      staticId: String
      categories: [ID]
      hasTransparency: Boolean
    }

  `

  queryDefinitions = gql`
    type Query { 
            
      """Get a list of Image with order and filtering options"""
      allImages(skip: Int, limit: Int, filters: ImageFilters, order: [ImageOrder]): ImageList! @Permissions(types: ["ADMIN"])
      
      """Get a specific Image by ID"""
      oneImage(id: ID!): Image! @Permissions(types: ["ADMIN"])
      
      """Get a count of Image with filtering options"""
      countImages(filters: ImageFilters): Int! @Permissions(types: ["ADMIN"])
      
      "Get one stati image by identifier"
      staticImage(id: ID): Image!
      
    } 
  `

  mutationDefinitions = gql`
    type Mutation { 
            
      """Add a new Image"""
      addImage(input: AddImageInput!): Image! @Permissions(types: ["ADMIN"])
      
      """Update an existing Image"""
      updateImage(id: ID!, input: UpdateImageInput!): Image! @Permissions(types: ["ADMIN"])
      
      """Delete a Image"""
      removeImage(id: ID!): ID! @Permissions(types: ["ADMIN"])
      
    } 
  `

}

export default ImageSchema
