import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { Role } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'
import { RoleList, QueryAllRolesArgs, QueryOneRoleArgs, QueryCountRolesArgs, MutationAddRoleArgs, MutationUpdateRoleArgs, MutationRemoveRoleArgs, RoleFilters, RoleOrder, Role as APIRole } from '@root/types/generated'
class RoleResolversGenerated {

  constructor() {
    this.allRoles = this.allRoles.bind(this)
    this.oneRole = this.oneRole.bind(this)
    this.countRoles = this.countRoles.bind(this)
    this.addRole = this.addRole.bind(this)
    this.updateRole = this.updateRole.bind(this)
    this.removeRole = this.removeRole.bind(this)
  }

  async allRoles(obj: any | null, args: QueryAllRolesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<RoleList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(Role).createQueryBuilder()
    await this.applyRoleFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyRoleOrder(qry, order as Array<RoleOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIRole> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('Role_', '')] = chunk[key]
        })
        yield Role.create(chunk) as unknown as APIRole
      }
      return
    }

    return {
      list: list as unknown as APIRole[],
      count,
      skip,
      limit,
    }
  }
  
  async oneRole(obj: any | null, args: QueryOneRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIRole> {
    const { id } = args
    const qry = AppDataSource.getRepository(Role).createQueryBuilder()
    await this.applyRoleFilters(qry, { id })
    const role = await qry.getOne()
    if (!role) {
      throw new GraphQLError(`Role not found`, { extensions: { code: '404' } })
    }
    return role as unknown as APIRole
  }
  
  async countRoles(obj: any | null, args: QueryCountRolesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(Role).createQueryBuilder()
    await this.applyRoleFilters(qry, filters)
    const roles = await qry.getCount()
    return roles
  }

  async addRole(obj: any | null, args: MutationAddRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIRole> {
    const { input } = args
    const role = Role.create(input as any)
    await role.save()
    clearCacheKeys([{ type: 'Role' }])
    return role as unknown as APIRole
  }

  async updateRole(obj: any | null, args: MutationUpdateRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIRole> {
    const { id, input } = args
    let exists = await this.checkRoleExists(id)
    if (!exists) {
      throw new GraphQLError(`Role Model not found`, { extensions: { code: '404' } })
    }
    const updateQry = AppDataSource.getRepository(Role).createQueryBuilder()
    await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<Role>).where(`"id" = :id`, { id }).execute()
    const getQry = AppDataSource.getRepository(Role).createQueryBuilder()
    const role = await getQry.where(`"id" = :id`, { id }).getOne()
    clearCacheKeys([{ type: 'Role', id: role?.id }])
    return role as unknown as APIRole
  }

  async removeRole(obj: any | null, args: MutationRemoveRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {
    const { id } = args
    const role = await AppDataSource.getRepository(Role).createQueryBuilder()
      .where('"id" = :id', { id })
      .getOne()
    if (!role) {
      throw new GraphQLError('Role not found', { extensions: { code: '404' } })
    }
    await role.remove()
    clearCacheKeys([{ type: 'Role', id }])
    return id
  }

  async checkRoleExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(Role).createQueryBuilder()
    const countRoles = await qry.where(`"id" = :id`, { id }).getCount()
    if (countRoles === 0) {
      return false
    }
    return true
  }
  
  async applyRoleFilters(qry: SelectQueryBuilder<Role>, filters: RoleFilters): Promise<void> {
    
  }
  
  async applyRoleOrder(qry: SelectQueryBuilder<Role>, order: Array<RoleOrder>): Promise<void> {
  
  }

}

export default RoleResolversGenerated
