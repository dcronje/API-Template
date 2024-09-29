import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { UserRole } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'
import { UserRoleList, QueryAllUserRolesArgs, QueryOneUserRoleArgs, QueryCountUserRolesArgs, MutationAddUserRoleArgs, MutationUpdateUserRoleArgs, MutationRemoveUserRoleArgs, UserRoleFilters, UserRoleOrder, UserRole as APIUserRole } from '@root/types/generated'
class UserRoleResolversGenerated {

  constructor() {
    this.allUserRoles = this.allUserRoles.bind(this)
    this.oneUserRole = this.oneUserRole.bind(this)
    this.countUserRoles = this.countUserRoles.bind(this)
    this.addUserRole = this.addUserRole.bind(this)
    this.updateUserRole = this.updateUserRole.bind(this)
    this.removeUserRole = this.removeUserRole.bind(this)
  }

  async allUserRoles(obj: any | null, args: QueryAllUserRolesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<UserRoleList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    await this.applyUserRoleFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyUserRoleOrder(qry, order as Array<UserRoleOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIUserRole> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('UserRole_', '')] = chunk[key]
        })
        yield UserRole.create(chunk) as unknown as APIUserRole
      }
      return
    }

    return {
      list: list as unknown as APIUserRole[],
      count,
      skip,
      limit,
    }
  }
  
  async oneUserRole(obj: any | null, args: QueryOneUserRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIUserRole> {
    const { id } = args
    const qry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    await this.applyUserRoleFilters(qry, { id })
    const userRole = await qry.getOne()
    if (!userRole) {
      throw new GraphQLError(`UserRole not found`, { extensions: { code: '404' } })
    }
    return userRole as unknown as APIUserRole
  }
  
  async countUserRoles(obj: any | null, args: QueryCountUserRolesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    await this.applyUserRoleFilters(qry, filters)
    const userRoles = await qry.getCount()
    return userRoles
  }

  async addUserRole(obj: any | null, args: MutationAddUserRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIUserRole> {
    const { input } = args
    const userRole = UserRole.create(input as any)
    await userRole.save()
    clearCacheKeys([{ type: 'UserRole' }])
    return userRole as unknown as APIUserRole
  }

  async updateUserRole(obj: any | null, args: MutationUpdateUserRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIUserRole> {
    const { id, input } = args
    let exists = await this.checkUserRoleExists(id)
    if (!exists) {
      throw new GraphQLError(`UserRole Model not found`, { extensions: { code: '404' } })
    }
    const updateQry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<UserRole>).where(`"id" = :id`, { id }).execute()
    const getQry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    const userRole = await getQry.where(`"id" = :id`, { id }).getOne()
    clearCacheKeys([{ type: 'UserRole', id: userRole?.id }])
    return userRole as unknown as APIUserRole
  }

  async removeUserRole(obj: any | null, args: MutationRemoveUserRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {
    const { id } = args
    const userRole = await AppDataSource.getRepository(UserRole).createQueryBuilder()
      .where('"id" = :id', { id })
      .getOne()
    if (!userRole) {
      throw new GraphQLError('UserRole not found', { extensions: { code: '404' } })
    }
    await userRole.remove()
    clearCacheKeys([{ type: 'UserRole', id }])
    return id
  }

  async checkUserRoleExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(UserRole).createQueryBuilder()
    const countUserRoles = await qry.where(`"id" = :id`, { id }).getCount()
    if (countUserRoles === 0) {
      return false
    }
    return true
  }
  
  async applyUserRoleFilters(qry: SelectQueryBuilder<UserRole>, filters: UserRoleFilters): Promise<void> {
    
  }
  
  async applyUserRoleOrder(qry: SelectQueryBuilder<UserRole>, order: Array<UserRoleOrder>): Promise<void> {
  
  }

}

export default UserRoleResolversGenerated
