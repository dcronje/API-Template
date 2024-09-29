import * as changeCase from 'change-case'
import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import PermissionResolversGenerated from '@generated/Permission/PermissionResolversGenerated'
import { PermissionFilters, PermissionOrder } from '@root/types/generated'
import { Permission } from '@models/index'

class PermissionResolvers extends PermissionResolversGenerated {

  register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allPermissions: this.allPermissions,
      onePermission: this.onePermission,
      countPermissions: this.countPermissions,
    }
    registry.registerType({
      queryResolvers,
    })
  }

  async applyPermissionFilters(qry: SelectQueryBuilder<Permission>, filters: PermissionFilters): Promise<void> {
    if (filters.id) {
      qry.andWhere(`"${qry.alias}"."id" = :id`, { id: filters.id })
    }
    if (filters.ids && filters.ids.length) {
      qry.andWhere(`"${qry.alias}"."id" IN (:...ids)`, { ids: filters.ids })
    }
    if (filters.types && filters.types.length) {
      qry.andWhere(`"${qry.alias}"."type" IN (:...types)`, { types: filters.types.map((type) => changeCase.pascalCase(type as string)) })
    }
    if (filters.search) {
      qry.andWhere(`"${qry.alias}".lower("name") LIKE :search`, { search: `%${filters.search.toLowerCase()}%` })
    }

  }

  applyPermissionOrder = async (qry: SelectQueryBuilder<Permission>, order: Array<PermissionOrder>): Promise<void> => {
    order.forEach((orderItem) => {
      switch (orderItem.field) {
        case undefined:

          break

        default:
          qry.orderBy(`"${qry.alias}"."${changeCase.camelCase(orderItem.field as string)}"`, orderItem.direction)
          break
      }
    })
  }

}

export default PermissionResolvers
