import { AppDataSource } from "@root/data-source"
import { User } from '@models/index'

export class UserPermissionResolvers {

  static async read(user: User, withData: any, forObject: string, andProperty: string | null) {
    if (forObject === 'User') {
      const userOwner = (withData[0] as User)
      if (userOwner.id === user.id) {
        return true
      }
      return false
    }
    switch (andProperty) {
      case 'allUserRoles': {
        return withData?.filters?.users?.length === 1 && withData.filters.users[0] === user.id
      } case 'oneUserRole': {
        return (await AppDataSource.query('SELECT COUNT(1) AS "count" FROM "user_role" WHERE "id" = $1 AND "userId" = $2', [withData?.id, user.id]))[0].count > 0
      } case 'countUserRoles': {
        return withData?.filters?.users?.length === 1 && withData.filters.users[0] === user.id
      } default: {
        return false
      }
    }
  }

  static async write(user: User, withData: any, forObject: string, andProperty: string | null) {

    switch (andProperty) {
      case 'updateUser': {
        return withData?.input?.user === user.id
      } default: {
        return false
      }
    }

  }

}