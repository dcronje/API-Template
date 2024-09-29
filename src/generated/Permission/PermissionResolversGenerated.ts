import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { Permission } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'
import { PermissionList, QueryAllPermissionsArgs, QueryOnePermissionArgs, QueryCountPermissionsArgs, PermissionFilters, PermissionOrder, Permission as APIPermission } from '@root/types/generated'
class PermissionResolversGenerated {

  constructor() {
    this.allPermissions = this.allPermissions.bind(this)
    this.onePermission = this.onePermission.bind(this)
    this.countPermissions = this.countPermissions.bind(this)
  }

  async allPermissions(obj: any | null, args: QueryAllPermissionsArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<PermissionList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    await this.applyPermissionFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyPermissionOrder(qry, order as Array<PermissionOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIPermission> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('Permission_', '')] = chunk[key]
        })
        yield Permission.create(chunk)
      }
      return
    }

    return {
      list: list as unknown as APIPermission[],
      count,
      skip,
      limit,
    }
  }
  
  async onePermission(obj: any | null, args: QueryOnePermissionArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIPermission> {
    const { id } = args
    const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    await this.applyPermissionFilters(qry, { id })
    const permission = await qry.getOne()
    if (!permission) {
      throw new GraphQLError(`Permission not found`, { extensions: { code: '404' } })
    }
    return permission as unknown as APIPermission
  }
  
  async countPermissions(obj: any | null, args: QueryCountPermissionsArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    await this.applyPermissionFilters(qry, filters)
    const permissions = await qry.getCount()
    return permissions
  }
  
  async checkPermissionExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    const countPermissions = await qry.where(`"id" = :id`, { id }).getCount()
    if (countPermissions === 0) {
      return false
    }
    return true
  }
  
  async applyPermissionFilters(qry: SelectQueryBuilder<Permission>, filters: PermissionFilters): Promise<void> {
    
  }
  
  async applyPermissionOrder(qry: SelectQueryBuilder<Permission>, order: Array<PermissionOrder>): Promise<void> {
  
  }

}

export default PermissionResolversGenerated
