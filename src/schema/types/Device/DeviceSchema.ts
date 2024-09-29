import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

class DeviceSchema {

  register(registry: GQLRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
      mutationDefinitions: this.mutationDefinitions,
    })
  }

  typeDefinitions = gql`

    enum RegisteredDeviceTypeEnum {
      "Browser"
      BROWSER
      "Android"
      ANDROID
      "iOS"
      IOS
    }

    input RegisterDeviceInput {
      userAgent: String
      type: RegisteredDeviceTypeEnum!
    }

    """Represents a Device in the system"""
    type Device {
      """The Devices ID"""
      id: ID!
      """The Devices type"""
      type: RegisteredDeviceTypeEnum!
      "The devices UserAgent String"
      userAgent: String
      userDevices: [UserDevice!]!
      """The creation date of the Device"""
      createdAt: DateTime
      """The update date of the Device"""
      updatedAt: DateTime
    }
  
    """Properties list object"""
    type DeviceList {
      """A list of Properties"""
      list: [Device]!
      """A count of Properties"""
      count: Int!
      """Number of Device records skipped"""
      skip: Int!
      """Number of Device records returned"""
      limit: Int!
    }

    type DeviceInfo {
      id: ID!
      isBot: Boolean!
    }

  `

  mutationDefinitions = gql`
    type Mutation { 
      """Register a new Device"""
      registerDevice(input: RegisterDeviceInput!): DeviceInfo!
      """Validate an existing device"""
      validateDevice(token: String!): DeviceInfo
      
    } 
  `

}

export default DeviceSchema
