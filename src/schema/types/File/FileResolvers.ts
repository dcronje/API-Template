import * as changeCase from 'change-case'
import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import FileResolversGenerated from '@generated/File/FileResolversGenerated'
import { FileFilters, FileOrder } from '@root/types/generated'
import { File } from '@models/index'

class FileResolvers extends FileResolversGenerated {

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allFiles: this.allFiles,
      oneFile: this.oneFile,
      countFiles: this.countFiles,
    }
    registry.registerType({
      queryResolvers,
      typeResolvers: this.typeResolvers,
    })
  }

  typeResolvers = {
    File: {
      __resolveType(obj: File): string | null {
        if (obj instanceof Image) {
          return 'Image'
        }
        return null
      },
    },
  }

  async applyFileFilters(qry: SelectQueryBuilder<File>, filters: FileFilters): Promise<void> {
    if (filters.minCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" >= :minCreatedAt`, { minCreatedAt: filters.minCreatedAt })
    }

  }

  async applyFileOrder(qry: SelectQueryBuilder<File>, order: Array<FileOrder>): Promise<void> {
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

export default FileResolvers
