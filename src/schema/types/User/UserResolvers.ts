import UserResolversGenerated from '@generated/User/UserResolversGenerated'
import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import * as changeCase from 'change-case'
import { Brackets, SelectQueryBuilder } from 'typeorm'
import { UserFilters, UserOrder } from '@root/types/generated'
import { UserPermissionResolvers } from './UserPermissionResolvers'
import { User } from '@models/index'

class UserResolvers extends UserResolversGenerated {

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allUsers: this.allUsers,
      oneUser: this.oneUser,
      countUsers: this.countUsers,
    }

    registry.registerType({
      queryResolvers,
      typeResolvers: this.typeResolvers,
    })

    permissionRegistry.registerPermissions([{
      name: 'User Read Owned',
      description: 'Read a user object that is owned',
      isOwned: true,
    }, {
      name: 'User Write Owned',
      description: 'Write a user object that is owned',
      isOwned: true,
    }, {
      name: 'Super Admin',
      description: 'Super Admin',
      isOwned: true,
    }, {
      name: 'Admin',
      description: 'Admin',
      isOwned: true,
    }])

    permissionRegistry.registerResolver('USER_READ_OWNED', UserPermissionResolvers.read)
    permissionRegistry.registerResolver('USER_WRITE_OWNED', UserPermissionResolvers.write)

  }

  typeResolvers = {
    User: {
      __resolveType(obj: User): string {
        return obj.constructor.name
      },
    },
  }

  async applyUserFilters(qry: SelectQueryBuilder<User>, filters: UserFilters): Promise<void> {

    if (filters.id) {
      qry.andWhere(`"${qry.alias}"."id" = :id`, { id: filters.id })
    }

    if (filters.ids) {
      qry.andWhereInIds(filters.ids)
    }

    if (filters.search) {
      let phoneSubQryAdded = false
      const searchCols = ['firstName', 'lastName', 'email', 'phone']
      const words: string[] = filters.search.split(' ')
      for (let w = 0; w < words.length; w++) {
        if (words[w].trim()) {
          qry.andWhere(new Brackets((qb) => {
            for (let c = 0; c < searchCols.length; c++) {
              if (c === 0) {
                qb.where(`LOWER("${qry.alias}"."${searchCols[c]}") LIKE :${w}${c}`, { [`${w}${c}`]: `%${words[w].toLowerCase()}%` })
              } else {
                qb.orWhere(`LOWER("${qry.alias}"."${searchCols[c]}") LIKE :${w}${c}`, { [`${w}${c}`]: `%${words[w].toLowerCase()}%` })
              }
            }
            if (!phoneSubQryAdded) {
              let phoneSearch = filters.search?.replace(' ', '')
              if (phoneSearch) {
                phoneSearch = phoneSearch.replace('+27', '0')
              }
              if (phoneSearch?.match(/^[0]{1}[1-9]{1}[0-9]{3,14}$/)) {
                qb.orWhere('REPLACE(REPLACE("phone", \' \', \'\'), \'+27\', \'0\') LIKE :nPhone', { nPhone: '%' + phoneSearch + '%' })
              }
              phoneSubQryAdded = true
            }
          }))
        }
      }
    }

    if (filters.isInvited) {
      qry.andWhere(`"${qry.alias}"."isInvited"`)
    }

    if (filters.hasAcceptedInvite) {
      qry.andWhere(`"${qry.alias}"."hasAcceptedInvite"`)
    }

    if (filters.minCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" >= :minCreatedAt`, { minCreatedAt: filters.minCreatedAt })
    }

    if (filters.maxCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" <= :maxCreatedAt`, { maxCreatedAt: filters.maxCreatedAt })
    }

    if (filters.createdAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" = :createdAt`, { createdAt: filters.createdAt })
    }

    if (filters.minUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" >= :minUpdatedAt`, { minUpdatedAt: filters.minUpdatedAt })
    }

    if (filters.maxUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" <= :maxUpdatedAt`, { maxUpdatedAt: filters.maxUpdatedAt })
    }

    if (filters.updatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" = :updatedAt`, { updatedAt: filters.updatedAt })
    }

  }

  async applyUserOrder(qry: SelectQueryBuilder<User>, order: Array<UserOrder>): Promise<void> {
    if (order && order.length) {
      order.forEach((orderItem: UserOrder) => {
        if (orderItem.field) {
          const orderByField = changeCase.camelCase(orderItem.field as string)
          switch (orderItem.field) {
            case 'NAME':
              qry.addOrderBy('"firstName"', orderItem.direction).addOrderBy('"lastName"', orderItem.direction)
              break
            default:
              qry.addOrderBy(`"${qry.alias}"."${orderByField}"`, orderItem.direction)
              break
          }
        }
      })
    }

  }

}

export default UserResolvers
