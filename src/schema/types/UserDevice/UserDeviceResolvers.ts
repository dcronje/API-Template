import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import UserDeviceResolversGenerated from '@generated/UserDevice/UserDeviceResolversGenerated'

class UserDeviceResolvers extends UserDeviceResolversGenerated {

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {

  }

}

export default UserDeviceResolvers
