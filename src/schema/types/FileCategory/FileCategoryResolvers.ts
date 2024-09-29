import * as changeCase from 'change-case'
import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import FileCategoryResolversGenerated from '@generated/FileCategory/FileCategoryResolversGenerated'
import { FileCategoryFilters, FileCategoryOrder } from '@root/types/generated'
import { FileCategory } from '@models/index'

class FileCategoryResolvers extends FileCategoryResolversGenerated {

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allFileCategories: this.allFileCategories,
      oneFileCategory: this.oneFileCategory,
      countFileCategories: this.countFileCategories,
    }
    const mutationResolvers = {
      addFileCategory: this.addFileCategory,
      updateFileCategory: this.updateFileCategory,
      removeFileCategory: this.removeFileCategory,
    }
    registry.registerType({
      queryResolvers,
      mutationResolvers,
    })
  }

  async applyFileCategoryFilters(qry: SelectQueryBuilder<FileCategory>, filters: FileCategoryFilters): Promise<void> {
    qry.where('1 = 1')
    if (filters.id) {
      qry.andWhere('"id" = :id', { id: filters.id })
    }
    if (filters.ids && filters.ids.length) {
      qry.andWhere('"id" IN (:...ids)', { ids: filters.ids })
    }
    if (filters.search) {
      qry.andWhere('lower("name") LIKE :search', { search: `%${filters.search.toLowerCase()}%` })
    }

  }

  async applyFileCategoryOrder(qry: SelectQueryBuilder<FileCategory>, order: Array<FileCategoryOrder>): Promise<void> {
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

export default FileCategoryResolvers
