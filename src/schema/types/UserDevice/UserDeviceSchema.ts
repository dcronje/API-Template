import { GQLRegistry } from 'gql-registry'
import gql from 'graphql-tag'

class UserDeviceSchema {

  register(registry: GQLRegistry): void {
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
