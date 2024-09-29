import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { FileCategory } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'
import { FileCategoryList, QueryAllFileCategoriesArgs, QueryOneFileCategoryArgs, QueryCountFileCategoriesArgs, MutationAddFileCategoryArgs, MutationUpdateFileCategoryArgs, MutationRemoveFileCategoryArgs, FileCategoryFilters, FileCategoryOrder, FileCategory as APIFileCategory } from '@root/types/generated'
class FileCategoryResolversGenerated {

  constructor() {
    this.allFileCategories = this.allFileCategories.bind(this)
    this.oneFileCategory = this.oneFileCategory.bind(this)
    this.countFileCategories = this.countFileCategories.bind(this)
    this.addFileCategory = this.addFileCategory.bind(this)
    this.updateFileCategory = this.updateFileCategory.bind(this)
    this.removeFileCategory = this.removeFileCategory.bind(this)
  }

  async allFileCategories(obj: any | null, args: QueryAllFileCategoriesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<FileCategoryList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    await this.applyFileCategoryFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyFileCategoryOrder(qry, order as Array<FileCategoryOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIFileCategory> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('FileCategory_', '')] = chunk[key]
        })
        yield FileCategory.create(chunk) as unknown as APIFileCategory
      }
      return
    }

    return {
      list: list as unknown as APIFileCategory[],
      count,
      skip,
      limit,
    }
  }
  
  async oneFileCategory(obj: any | null, args: QueryOneFileCategoryArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIFileCategory> {
    const { id } = args
    const qry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    await this.applyFileCategoryFilters(qry, { id })
    const fileCategory = await qry.getOne()
    if (!fileCategory) {
      throw new GraphQLError(`FileCategory not found`, { extensions: { code: '404' } })
    }
    return fileCategory as unknown as APIFileCategory
  }
  
  async countFileCategories(obj: any | null, args: QueryCountFileCategoriesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    await this.applyFileCategoryFilters(qry, filters)
    const fileCategories = await qry.getCount()
    return fileCategories
  }

  async addFileCategory(obj: any | null, args: MutationAddFileCategoryArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIFileCategory> {
    const { input } = args
    const fileCategory = FileCategory.create(input as any)
    await fileCategory.save()
    clearCacheKeys([{ type: 'FileCategory' }])
    return fileCategory as unknown as APIFileCategory
  }

  async updateFileCategory(obj: any | null, args: MutationUpdateFileCategoryArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIFileCategory> {
    const { id, input } = args
    let exists = await this.checkFileCategoryExists(id)
    if (!exists) {
      throw new GraphQLError(`FileCategory Model not found`, { extensions: { code: '404' } })
    }
    const updateQry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<FileCategory>).where(`"id" = :id`, { id }).execute()
    const getQry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    const fileCategory = await getQry.where(`"id" = :id`, { id }).getOne()
    clearCacheKeys([{ type: 'FileCategory', id: fileCategory?.id }])
    return fileCategory as unknown as APIFileCategory
  }

  async removeFileCategory(obj: any | null, args: MutationRemoveFileCategoryArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {
    const { id } = args
    const fileCategory = await AppDataSource.getRepository(FileCategory).createQueryBuilder()
      .where('"id" = :id', { id })
      .getOne()
    if (!fileCategory) {
      throw new GraphQLError('FileCategory not found', { extensions: { code: '404' } })
    }
    await fileCategory.remove()
    clearCacheKeys([{ type: 'FileCategory', id }])
    return id
  }

  async checkFileCategoryExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(FileCategory).createQueryBuilder()
    const countFileCategories = await qry.where(`"id" = :id`, { id }).getCount()
    if (countFileCategories === 0) {
      return false
    }
    return true
  }
  
  async applyFileCategoryFilters(qry: SelectQueryBuilder<FileCategory>, filters: FileCategoryFilters): Promise<void> {
    
  }
  
  async applyFileCategoryOrder(qry: SelectQueryBuilder<FileCategory>, order: Array<FileCategoryOrder>): Promise<void> {
  
  }

}

export default FileCategoryResolversGenerated
