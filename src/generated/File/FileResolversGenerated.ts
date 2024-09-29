import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { File } from '@models/index'
import { GraphQLResolveInfo } from 'graphql'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { FileList, QueryAllFilesArgs, QueryOneFileArgs, QueryCountFilesArgs, FileFilters, FileOrder, File as APIFile } from '@root/types/generated'

class FileResolversGenerated {

  constructor() {
    this.allFiles = this.allFiles.bind(this)
    this.oneFile = this.oneFile.bind(this)
    this.countFiles = this.countFiles.bind(this)
  }

  async allFiles(obj: any | null, args: QueryAllFilesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<FileList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(File).createQueryBuilder()
    await this.applyFileFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyFileOrder(qry, order as Array<FileOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIFile> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('File_', '')] = chunk[key]
        })
        yield AppDataSource.getRepository(chunk.type).create(chunk) as unknown as APIFile
      }
      return
    }

    return {
      list: list as unknown as APIFile[],
      count,
      skip,
      limit,
    }
  }
  
  async oneFile(obj: any | null, args: QueryOneFileArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIFile> {
    const { id } = args
    const qry = AppDataSource.getRepository(File).createQueryBuilder()
    await this.applyFileFilters(qry, { id })
    const file = await qry.getOne()
    if (!file) {
      throw new Error(`File not found`)
    }
    return file as unknown as APIFile
  }
  
  async countFiles(obj: any | null, args: QueryCountFilesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(File).createQueryBuilder()
    await this.applyFileFilters(qry, filters)
    const files = await qry.getCount()
    return files
  }
  
  async checkFileExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(File).createQueryBuilder()
    const countFiles = await qry.where(`"id" = :id`, { id }).getCount()
    if (countFiles === 0) {
      return false
    }
    return true
  }
  
  async applyFileFilters(qry: SelectQueryBuilder<File>, filters: FileFilters): Promise<void> {
    
  }
  
  async applyFileOrder(qry: SelectQueryBuilder<File>, order: Array<FileOrder>): Promise<void> {
  
  }
  
}

export default FileResolversGenerated
