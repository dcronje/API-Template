import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { Image } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'
import { ImageList, QueryAllImagesArgs, QueryOneImageArgs, QueryCountImagesArgs, MutationAddImageArgs, MutationUpdateImageArgs, MutationRemoveImageArgs, ImageFilters, ImageOrder, Image as APIImage } from '@root/types/generated'
class ImageResolversGenerated {

  constructor() {
    this.allImages = this.allImages.bind(this)
    this.oneImage = this.oneImage.bind(this)
    this.countImages = this.countImages.bind(this)
    this.addImage = this.addImage.bind(this)
    this.updateImage = this.updateImage.bind(this)
    this.removeImage = this.removeImage.bind(this)
  }

  async allImages(obj: any | null, args: QueryAllImagesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<ImageList> {
    const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
    const qry = AppDataSource.getRepository(Image).createQueryBuilder()
    await this.applyImageFilters(qry, filters)
    const count = await qry.getCount()
    await this.applyImageOrder(qry, order as Array<ImageOrder>)
    qry.limit(limit).skip(skip)
    const list = async function* (): AsyncIterable<APIImage> {
      const dataStream: ReadStream = await qry
        .stream()
      for await (const chunk of dataStream) {
        Object.keys(chunk).forEach((key) => {
          chunk[key.replace('Image_', '')] = chunk[key]
        })
        yield Image.create(chunk) as unknown as APIImage
      }
      return
    }

    return {
      list: list as unknown as APIImage[],
      count,
      skip,
      limit,
    }
  }
  
  async oneImage(obj: any | null, args: QueryOneImageArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIImage> {
    const { id } = args
    const qry = AppDataSource.getRepository(Image).createQueryBuilder()
    await this.applyImageFilters(qry, { id })
    const image = await qry.getOne()
    if (!image) {
      throw new GraphQLError(`Image not found`, { extensions: { code: '404' } })
    }
    return image as unknown as APIImage
  }
  
  async countImages(obj: any | null, args: QueryCountImagesArgs = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
    const { filters = {} } = args
    const qry = AppDataSource.getRepository(Image).createQueryBuilder()
    await this.applyImageFilters(qry, filters)
    const images = await qry.getCount()
    return images
  }

  async addImage(obj: any | null, args: MutationAddImageArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIImage> {
    const { input } = args
    const image = Image.create(input as any)
    await image.save()
    clearCacheKeys([{ type: 'Image' }])
    return image as unknown as APIImage
  }

  async updateImage(obj: any | null, args: MutationUpdateImageArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIImage> {
    const { id, input } = args
    let exists = await this.checkImageExists(id)
    if (!exists) {
      throw new GraphQLError(`Image Model not found`, { extensions: { code: '404' } })
    }
    const updateQry = AppDataSource.getRepository(Image).createQueryBuilder()
    await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<Image>).where(`"id" = :id`, { id }).execute()
    const getQry = AppDataSource.getRepository(Image).createQueryBuilder()
    const image = await getQry.where(`"id" = :id`, { id }).getOne()
    clearCacheKeys([{ type: 'Image', id: image?.id }])
    return image as unknown as APIImage
  }

  async removeImage(obj: any | null, args: MutationRemoveImageArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {
    const { id } = args
    const image = await AppDataSource.getRepository(Image).createQueryBuilder()
      .where('"id" = :id', { id })
      .getOne()
    if (!image) {
      throw new GraphQLError('Image not found', { extensions: { code: '404' } })
    }
    await image.remove()
    clearCacheKeys([{ type: 'Image', id }])
    return id
  }

  async checkImageExists(id: ID): Promise<boolean> {
    const qry = AppDataSource.getRepository(Image).createQueryBuilder()
    const countImages = await qry.where(`"id" = :id`, { id }).getCount()
    if (countImages === 0) {
      return false
    }
    return true
  }
  
  async applyImageFilters(qry: SelectQueryBuilder<Image>, filters: ImageFilters): Promise<void> {
    
  }
  
  async applyImageOrder(qry: SelectQueryBuilder<Image>, order: Array<ImageOrder>): Promise<void> {
  
  }

}

export default ImageResolversGenerated
