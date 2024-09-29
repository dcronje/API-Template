import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

class UserDeviceSchema {

  register(registry: APIRegistry): void {
    registry.registerType({
      typeDefinitions: this.typeDefinitions,
    })
  }

  typeDefinitions = gql`

    """Represents a UserDevice in the system"""
    type UserDevice {
      """The UserDevice's ID"""
      id: ID!
      active: Boolean!
      user: User!
      device: Device!
      """The creation date of the UserDevice"""
      createdAt: DateTime
      """The update date of the UserDevice"""
      updatedAt: DateTime
    }

  `

}

export default UserDeviceSchema
