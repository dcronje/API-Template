import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import UserRoleResolversGenerated from '@generated/UserRole/UserRoleResolversGenerated'
import * as changeCase from 'change-case'
import { GraphQLError } from 'graphql'
import { UserRoleFilters, UserRoleOrder } from '@root/types/generated'
import { UserRole } from '@models/index'

class UserRoleResolvers extends UserRoleResolversGenerated {

  register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allUserRoles: this.allUserRoles,
      oneUserRole: this.oneUserRole,
      countUserRoles: this.countUserRoles,
    }
    const mutationResolvers = {
      addUserRole: this.addUserRole,
      removeUserRole: this.removeUserRole,
      updateUserRole: this.updateUserRole,
    }
    registry.registerType({
      queryResolvers,
      mutationResolvers,
    })
  }

  async applyUserRoleFilters(qry: SelectQueryBuilder<UserRole>, filters: UserRoleFilters): Promise<void> {
    if (filters.minCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" >= :minCreatedAt`, { minCreatedAt: filters.minCreatedAt })
    }
    if (filters.maxCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" <= :maxCreatedAt`, { maxCreatedAt: filters.maxCreatedAt })
    }
    if (filters.minUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" >= :minUpdatedAt`, { minUpdatedAt: filters.minUpdatedAt })
    }
    if (filters.maxUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" <= :maxUpdatedAt`, { maxUpdatedAt: filters.maxUpdatedAt })
    }
    if (filters.createdAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" = :createdAt`, { createdAt: filters.createdAt })
    }
    if (filters.updatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" = :updatedAt`, { updatedAt: filters.updatedAt })
    }
    if (filters.id) {
      qry.andWhere(`"${qry.alias}"."id" = :id`, { id: filters.id })
    }
    if (filters.ids) {
      qry.whereInIds(filters.ids)
    }
    if (filters.users) {
      qry.andWhere(`"${qry.alias}"."userId" IN (:...users)`, { users: filters.users })
    }
    if (filters.roles) {
      qry.andWhere(`"${qry.alias}"."roleId" IN (:...roles)`, { roles: filters.roles })
    }

  }

  async applyUserRoleOrder(qry: SelectQueryBuilder<UserRole>, order: Array<UserRoleOrder>): Promise<void> {
    order.forEach((orderItem: UserRoleOrder) => {
      const orderByField = changeCase.camelCase(orderItem.field as string)
      qry.addOrderBy(`"${qry.alias}"."${orderByField}"`, orderItem.direction)
    })
  }

}

export default UserRoleResolvers
