import { Column, ChildEntity, Index } from 'typeorm'
import { ImageInfo } from '@lib/AWSHelper'
import queryString from 'qs'
import { ImageTransform } from '@root/types/generated'
import { ImageEncodingEnum, ImageScaleEnum } from '@root/enums'
import { File } from '@models/index'

export interface ImageUrlArgs {
  width?: number
  height?: number
  scale?: ImageScaleEnum
  transforms?: ImageTransform[]
  encoding?: ImageEncodingEnum
}

@ChildEntity()
export class Image extends File {

  @Column({ type: 'jsonb' })
  imageInfo!: ImageInfo

  @Index()
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean

  @Column({ type: 'boolean', default: false })
  hasTransparency!: boolean

  @Index()
  @Column({ type: 'varchar', nullable: true })
  staticId!: string | null

  @Column({ type: 'varchar', default: 'WMS' })
  alt!: string

  isVector(): boolean {
    return this.mimetype === 'image/svg+xml'
  }

  encoding(): ImageEncodingEnum {
    let imageType = ImageEncodingEnum.Jpeg
    if (this.mimetype === 'image/svg+xml') {
      imageType = ImageEncodingEnum.Svg
    } else if (this.mimetype === 'image/png') {
      imageType = ImageEncodingEnum.Png
    } else if (this.mimetype === 'image/webp') {
      imageType = ImageEncodingEnum.Webp
    }
    return imageType
  }

  url(args: ImageUrlArgs): string {
    let url = `${process.env.PROTOCOL}://${process.env.DOMAIN}`
    if (process.env.PORT && process.env.NODE_ENV !== 'production') {
      url += `:${process.env.PORT}`
    }
    if (process.env.IMAGES_BASE_URL) {
      url = process.env.IMAGES_BASE_URL
    }
    url += '/images/'
    const urlParams: { [k: string]: any } = {}
    if (args.width) {
      urlParams.width = args.width
    }
    if (args.height) {
      urlParams.height = args.height
    }
    if (args.scale) {
      urlParams.scale = args.scale
    }
    if (args.transforms) {
      urlParams.transforms = args.transforms
    }
    let imageType = 'jpeg'
    if (this.mimetype === 'image/svg+xml') {
      imageType = 'svg'
    } else if (args.encoding === ImageEncodingEnum.Png) {
      imageType = 'jpeg'
    } else if (args.encoding === ImageEncodingEnum.Webp) {
      imageType = 'webp'
    }
    urlParams.encoding = imageType
    if (Object.keys(urlParams).length) {
      const params = queryString.stringify(urlParams, { skipNulls: true, addQueryPrefix: false, delimiter: '|' })
      url += `${params}/`
    }

    url += `${this.key}.${imageType}`
    return url
  }

  async preCache(args: ImageUrlArgs): Promise<void> {
    const url = await this.url(args)
    await fetch(url)
  }

}
