import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { User } from '@models/index'
import { GraphQLResolveInfo } from 'graphql'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { UserList, QueryAllUsersArgs, QueryOneUserArgs, QueryCountUsersArgs, UserFilters, UserOrder, User as APIUser } from '@root/types/generated'

class UserResolversGenerated {

  constructor() {
    this.allUsers = this.allUsers.bind(this)
    this.oneUser = this.oneUser.bind(this)
    this.countUsers = this.countUsers.bind(this)
  }

  async allUsers(obj: any | null, args: QueryAllUsersArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<UserList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(User).createQueryBuilder()
    await this.applyUserFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyUserOrder(qry, order as Array<UserOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIUser> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('User_', '')] = chunk[key]
        })
        yield AppDataSource.getRepository(chunk.type).create(chunk) as unknown as APIUser
      }
      return
    }

    return {
      list: list as unknown as APIUser[],
      count,
      skip,
      limit,
    }
  }
  
  async oneUser(obj: any | null, args: QueryOneUserArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIUser> {
    const { id } = args
    const qry = AppDataSource.getRepository(User).createQueryBuilder()
    await this.applyUserFilters(qry, { id })
    const user = await qry.getOne()
    if (!user) {
      throw new Error(`User not found`)
    }
    return user as unknown as APIUser
  }
  
  async countUsers(obj: any | null, args: QueryCountUsersArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(User).createQueryBuilder()
    await this.applyUserFilters(qry, filters)
    const users = await qry.getCount()
    return users
  }
  
  async checkUserExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(User).createQueryBuilder()
    const countUsers = await qry.where(`"id" = :id`, { id }).getCount()
    if (countUsers === 0) {
      return false
    }
    return true
  }
  
  async applyUserFilters(qry: SelectQueryBuilder<User>, filters: UserFilters): Promise<void> {
    
  }
  
  async applyUserOrder(qry: SelectQueryBuilder<User>, order: Array<UserOrder>): Promise<void> {
  
  }
  
}

export default UserResolversGenerated
