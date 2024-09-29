import * as changeCase from 'change-case'
import { GraphQLError } from 'graphql'
import AWSHelper from '@lib/AWSHelper'
import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import ImageResolversGenerated from '@generated/Image/ImageResolversGenerated'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AppDataSource } from '@root/data-source'
import { QueryStaticImageArgs, MutationAddImageArgs, MutationUpdateImageArgs, MutationRemoveImageArgs, ImageFilters, ImageOrder, Image as APIImage } from '@root/types/generated'
import { ImageEncodingEnum } from '@root/enums'
import { FileCategory, Image } from '@models/index'

class ImageResolvers extends ImageResolversGenerated {

  constructor() {
    super()
    this.staticImage = this.staticImage.bind(this)
  }

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allImages: this.allImages,
      oneImage: this.oneImage,
      countImages: this.countImages,
      staticImage: this.staticImage,
    }
    const mutationResolvers = {
      addImage: this.addImage,
      updateImage: this.updateImage,
      removeImage: this.removeImage,
    }
    registry.registerType({
      queryResolvers,
      mutationResolvers,
    })
  }

  async staticImage(obj: unknown | null, args: QueryStaticImageArgs = {}): Promise<APIImage | null> {
    const { id } = args
    let image = await AppDataSource.getRepository(Image).createQueryBuilder('file')
      .where('"staticId" = :staticId', { staticId: id })
      .getOne()
    if (!image) {
      image = await AppDataSource.getRepository(Image).createQueryBuilder('file')
        .where('"isDefault" = TRUE')
        .getOne()
    }
    return image as unknown as APIImage
  }

  async addImage(_: unknown | null, args: MutationAddImageArgs): Promise<APIImage> {
    const { input } = args
    const awsHelper = new AWSHelper()
    const result = await awsHelper.addImage(input.file)
    const insertQry = AppDataSource.getRepository(Image).createQueryBuilder()
    const response = await insertQry.insert().values([{ ...result, name: input.name, staticId: input.staticId } as QueryDeepPartialEntity<Image>]).execute()
    const insertedId = response.identifiers[0].id
    const getQry = AppDataSource.getRepository(Image).createQueryBuilder()
    const image = await getQry.where({ id: insertedId }).getOne()
    if (image && input.categories) {
      const categories = await FileCategory.findByIds(input.categories)
      image.categories = categories
      await image.save()
    }
    if (image && input.staticId) {
      image.staticId = input.staticId
      await image.save()
    }
    if (!image) {
      throw new GraphQLError('Image not found')
    }
    return image as unknown as APIImage
  }

  async updateImage(obj: unknown | null, args: MutationUpdateImageArgs): Promise<APIImage> {
    const { id, input } = args
    const exists = await this.checkImageExists(id)
    if (!exists) {
      throw new GraphQLError('Image Model not found', { extensions: { code: '404' } })
    }
    let categories: string[] | null = null
    if (input.categories) {
      categories = input.categories as string[]
      delete input.categories
    }
    const updateQry = AppDataSource.getRepository(Image).createQueryBuilder()
    await updateQry.update().set({ ...input } as QueryDeepPartialEntity<Image>).where('"id" = :id', { id }).execute()
    const getQry = AppDataSource.getRepository(Image).createQueryBuilder()
    const image = await getQry.where('"id" = :id', { id }).getOne()
    if (image && categories) {
      const newCategories = await FileCategory.findByIds(categories)
      image.categories = newCategories
      await image.save()
    }
    if (!image) {
      throw new GraphQLError('Image not found')
    }
    return image as unknown as APIImage
  }

  async removeImage(obj: unknown | null, args: MutationRemoveImageArgs): Promise<string> {
    const { id } = args
    const awsHelper = new AWSHelper()
    const qry = AppDataSource.getRepository(Image).createQueryBuilder()
    await this.applyImageFilters(qry, { id })
    const image = await qry.getOne()
    if (!image) {
      throw new GraphQLError('Image Model not found', { extensions: { code: '404' } })
    }
    await awsHelper.removeImage(image.key)
    const removeQry = AppDataSource.getRepository(Image).createQueryBuilder()
    await removeQry.delete().where('"id" = :id', { id }).execute()
    return id
  }

  async applyImageFilters(qry: SelectQueryBuilder<Image>, filters: ImageFilters): Promise<void> {

    if (filters.id) {
      qry.andWhere(`"${qry.alias}"."id" = :id`, { id: filters.id })
    }
    if (filters.ids && filters.ids.length) {
      qry.andWhere(`"${qry.alias}"."id" IN (:...ids)`, { ids: filters.ids })
    }
    if (filters.minCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" >= :minCreatedAt`, { minCreatedAt: filters.minCreatedAt })
    }
    if (filters.search) {
      qry.andWhere(`"${qry.alias}".LOWER("name") LIKE LOWER(:name)`, { name: `%${filters.search}%` })
    }
    if (filters.encoding && filters.encoding.length) {
      if (filters.encoding.includes(ImageEncodingEnum.Jpeg as unknown as ImageEncodingEnum)) {
        qry.andWhere(`"${qry.alias}"."mimetype" = :encoding`, { encoding: 'image/jpeg' })
      }
      if (filters.encoding.includes(ImageEncodingEnum.Svg as unknown as ImageEncodingEnum)) {
        qry.andWhere(`"${qry.alias}"."mimetype" = :encoding`, { encoding: 'image/svg+xml' })
      }
      if (filters.encoding.includes(ImageEncodingEnum.Png as unknown as ImageEncodingEnum)) {
        qry.andWhere(`"${qry.alias}"."mimetype" = :encoding`, { encoding: 'image/png' })
      }
      if (filters.encoding.includes(ImageEncodingEnum.Webp as unknown as ImageEncodingEnum)) {
        qry.andWhere(`"${qry.alias}"."mimetype" = :encoding`, { encoding: 'image/webp' })
      }
    }
    if (filters.categories && filters.categories.length) {
      const args: string[] = []
      filters.categories.forEach((__, index) => {
        args.push(`$${index + 1}`)
      })
      const imageIds = await AppDataSource.query(`SELECT "fileId" FROM "file_category_files" WHERE "fileCategoryId" IN (${args.join(', ')})`, filters.categories)
      if (imageIds.length) {
        qry.andWhere(`"${qry.alias}"."id" IN (:...ids)`, { ids: imageIds.map((image: { fileId: string }) => image.fileId) })
      } else {
        qry.andWhere(`"${qry.alias}".1 = 2`)
      }
    }

  }

  async applyImageOrder(qry: SelectQueryBuilder<Image>, order: Array<ImageOrder>): Promise<void> {
    order.forEach((orderItem) => {
      switch (orderItem.field) {
        case undefined:

          break

        default:
          qry.orderBy(`"${qry.alias}"."${changeCase.camelCase(orderItem.field as string)}"`, orderItem.direction || 'DESC')
          break
      }
    })
  }

}

export default ImageResolvers
