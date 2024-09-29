import Jimp from 'jimp'
import sharp from 'sharp'
import fs from 'fs'
import request from 'request'
import { GraphQLError } from 'graphql'
import path from 'path'
import queryString from 'qs'
import Loki, { Collection } from 'lokijs'
import { createHash } from 'crypto'
import { Mutex, MutexInterface } from 'async-mutex'
import { v4 } from 'uuid'
import NodeCache from 'node-cache'
import { AppDataSource } from '@root/data-source'
import { Image } from '@models/index'

enum ScaleEnum {
  COVER = 'COVER',
  FIT = 'FIT',
  CONTAIN = 'CONTAIN',
}

enum TransformEnum {
  BLUR = 'BLUR',
  GAUSSIAN_BLUR = 'GAUSSIAN_BLUR',
  GREY_SCALE = 'GREY_SCALE',
  POSTERIZE = 'POSTERIZE',
  SEPIA = 'SEPIA',
  PIXELATE = 'PIXELATE',
  OPACITY = 'OPACITY',
  CMYK = 'CMYK',
}

interface ImageTransform {
  type: TransformEnum
  value: string
}

export interface ImageInputObject {
  width?: string | number
  height?: string | number
  scale?: ScaleEnum
  transforms?: ImageTransform[]
  [k: string]: unknown
}

interface ImageItem {
  id: string
  key: string
  isOriginal: boolean
  location: string
  params: string
}

export type ImageType = 'svg' | 'png' | 'jpeg' | 'webp'

const getHashKey = async (longKey: string): Promise<string> => {
  return createHash('sha256').update(longKey).digest('hex')
}

export class Images {

  static instance: Images | null = null

  static shared(): Images {
    if (!this.instance) {
      this.instance = new Images()
    }
    return this.instance
  }

  private db!: Loki
  private images!: Collection<ImageItem>
  private buffers = new NodeCache({ stdTTL: 600, checkperiod: 300 })
  private locks: Map<string, MutexInterface> = new Map()
  public originalDirectory = path.resolve(__basedir, './public/Images/Original')
  public cacheDirectory = path.resolve(__basedir, './public/Images/Cached')
  private isDeleting = false

  constructor() {
    this.db = new Loki(path.resolve(__basedir, './temp/images.db'))
    this.db.loadDatabase({}, () => {
      const images = this.db.getCollection('images')
      if (!images) {
        this.db.addCollection('images')
      }
      this.db.saveDatabase()
      this.images = this.db.getCollection('images')
    })

  }

  private processImageTransforms = async (imageData: Buffer, query: ImageInputObject | null, imageType: string): Promise<Buffer> => {

    if (!query) {
      query = {}
    }
    try {
      let { width = -1, height = -1, scale = ScaleEnum.COVER, transforms = [] } = query

      if (width === -1) {
        scale = ScaleEnum.FIT
      } else {
        width = parseInt(width as string)
      }
      if (height === -1) {
        scale = ScaleEnum.FIT
      } else {
        height = parseInt(height as string)
      }
      let image = await Jimp.read(imageData)
      // TODO: move to images
      if (imageType === 'jpeg') {
        image.background(0xFFFFFFFF)
      }
      image = image.quality(80)
      if (scale === ScaleEnum.COVER) {
        image = image.cover(width, height)
      } else if (scale === ScaleEnum.CONTAIN) {
        image = image.contain(width, height)
      } else {
        image = image.resize(width, height)
      }
      transforms.forEach((transform) => {
        switch (transform.type) {
          case TransformEnum.GAUSSIAN_BLUR:
            image = image.gaussian(parseFloat(transform.value))
            break
          case TransformEnum.BLUR:
            image = image.blur(parseFloat(transform.value))
            break
          case TransformEnum.GREY_SCALE:
            image = image.greyscale()
            break
          case TransformEnum.OPACITY:
            image = image.opacity(parseFloat(transform.value))
            break
          case TransformEnum.POSTERIZE:
            image = image.posterize(parseFloat(transform.value))
            break
          case TransformEnum.SEPIA:
            image = image.sepia()
            break
          case TransformEnum.PIXELATE:
            image = image.pixelate(parseFloat(transform.value))
            break

          default:
            break
        }
      })
      // TODO: move to images
      let imageBuffer!: Buffer
      if (imageType === 'png') {
        imageBuffer = await image.getBufferAsync('image/png')
        for (let t = 0; t < transforms.length; t++) {
          if (transforms[t].type === TransformEnum.CMYK) {
            imageBuffer = await sharp(imageBuffer)
              .png()
              .toColorspace('cmyk')
              .toBuffer()
          }
        }
      } else if (imageType === 'webp') {
        imageBuffer = await image.getBufferAsync('image/png')
        let toCMYK = false
        for (let t = 0; t < transforms.length; t++) {
          if (transforms[t].type === TransformEnum.CMYK) {
            toCMYK = true
          }
        }
        if (toCMYK) {
          imageBuffer = await sharp(imageBuffer)
            .webp()
            .toColorspace('cmyk')
            .toBuffer()
        } else {
          imageBuffer = await sharp(imageBuffer)
            .webp({ effort: 4, nearLossless: true })
            .toBuffer()
        }
      } else if (imageType === 'jpeg') {
        imageBuffer = await image.getBufferAsync('image/jpeg')
        for (let t = 0; t < transforms.length; t++) {
          if (transforms[t].type === TransformEnum.CMYK) {
            imageBuffer = await sharp(imageBuffer)
              .jpeg()
              .toColorspace('cmyk')
              .toBuffer()
          }
        }
      }
      return imageBuffer
    } catch (e) {
      return imageData
    }

  }

  private getOriginalImageFromOrigin = async (location: string): Promise<Buffer | null> => {
    return new Promise<Buffer | null>((resolve) => {
      request.get(location, { encoding: null }, (err: Error | null, _res: request.Response, body: Buffer): void => {
        if (err) {
          return resolve(null)
        }
        resolve(body)
      })
    })
  }

  private makeDirectory = async (directoryPath: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.mkdir(directoryPath, (err) => {
        if (err && err.code !== 'EEXIST') {
          return reject(err)
        }
        resolve()
      })
    })
  }

  private fileExists = async (filePath: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      fs.stat(filePath, (_, stat) => {
        if (stat?.isFile?.()) {
          return resolve(true)
        }
        resolve(false)
      })
    })
  }

  private directoryExists = async (directoryPath: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      fs.stat(directoryPath, (_, stat) => {
        if (stat?.isDirectory?.()) {
          return resolve(true)
        }
        resolve(false)
      })
    })
  }

  private readFile = async (filePath: string): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }

  private writeFile = async (filePath: string, data: Buffer): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  private deleteFile = async (filePath: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.rm(filePath, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  private deleteDirectory = async (directoryPath: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.rmdir(directoryPath, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  private isDirectory = (directory: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      fs.stat(directory, (err, stat) => {
        if (err) {
          return reject(err)
        }
        resolve(stat.isDirectory())
      })
    })
  }

  private getDirectoryContents = (directory: string): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) {
          return reject(err)
        }
        resolve(files)
      })
    })
  }

  private recurseDeleteDirectory = async (directory: string, deleteCurrent = true): Promise<void> => {
    const items = await this.getDirectoryContents(directory)
    for (let i = 0; i < items.length; i++) {
      const itemPath = path.join(directory, items[i])
      const isDir = await this.isDirectory(itemPath)
      if (isDir) {
        await this.recurseDeleteDirectory(itemPath)
      } else {
        await this.deleteFile(itemPath)
      }
    }
    if (deleteCurrent) {
      await this.deleteDirectory(directory)
    }
  }

  private getCachedData = async (id: string, key: string): Promise<Buffer | null | undefined> => {
    if (this.isDeleting) {
      setTimeout(() => {
        return this.getCachedData(id, key)
      }, 500)
    }
    let data: Buffer | null | undefined = null
    if (this.buffers.has(key)) {
      data = this.buffers.get<Buffer>(key) || null
    }
    if (!data) {
      const image = this.images.findOne({ key: id, isOriginal: true })
      if (image) {
        data = await this.readFile(image.location)
      }
    }
    return data
  }

  public process = async (id: string, imageType: ImageType, params = ''): Promise<Buffer | null | undefined> => {
    let data: Buffer | null | undefined = null
    const key = await getHashKey(`${params}-${id}`)
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex())
    }
    return this.locks
      .get(key)
      ?.runExclusive(async () => {
        try {
          data = await this.getCachedData(id, key)
          if (!data) {
            data = await this.getImageData(id, imageType, params)
            if (data) {
              const directory = path.join(this.cacheDirectory, `/${params}`)
              const directoryExists = await this.directoryExists(directory)
              if (!directoryExists) {
                await this.makeDirectory(directory)
              }
              const location = path.resolve(directory, `./${id}`)
              await this.writeFile(location, data)
              this.buffers.set(key, data)
              this.images.insert({ id: v4(), key: id, params, isOriginal: false, location })
              return new Promise<Buffer | null | undefined>((resolve) => {
                this.db.saveDatabase(() => {
                  resolve(data)
                })
              })
            }
          }
          return data
        } catch (e) {
          return null
        }
      })
  }

  public clearCache = async (id?: string): Promise<void> => {
    this.isDeleting = true
    this.buffers.flushAll()
    if (id) {
      const images = this.images.find({ key: { $eq: id } })
      for (let i = 0; i < images.length; i++) {
        await this.deleteFile(images[i].location)
        this.images.remove(images[i])
      }

    } else {
      await this.recurseDeleteDirectory(this.cacheDirectory, false)
      await this.recurseDeleteDirectory(this.originalDirectory, false)
      this.images.clear()
    }
    this.db.saveDatabase(() => {
      this.isDeleting = false
    })

  }

  private getOriginalImageData = async (id: string, url?: string): Promise<Buffer | null | undefined> => {
    if (!url) {
      return
    }
    let originalData: Buffer | null | undefined = null
    const key = `${id}-original`
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex())
    }
    return this.locks
      .get(key)
      ?.runExclusive(async () => {
        try {
          originalData = await this.getCachedData(id, key)
          if (!originalData) {
            originalData = await this.getOriginalImageFromOrigin(url)
            if (originalData) {
              const directory = this.originalDirectory
              const location = path.resolve(directory, `./${id}`)
              await this.writeFile(location, originalData)
              this.buffers.set(key, originalData)
              this.images.insert({ id: v4(), key: id, params: '', isOriginal: true, location })
            }
          }
          return originalData
        } catch (e) {
          return null
        }
      })

  }

  private getImageData = async (id: string, imageType: ImageType, params = ''): Promise<Buffer | null | undefined> => {
    try {
      let imageInputs: ImageInputObject | null = null
      if (params) {
        imageInputs = queryString.parse(params, { delimiter: '|' })
      }
      let originalData: Buffer | null | undefined = null
      const image = await AppDataSource.getRepository(Image).createQueryBuilder()
        .where('"id" = :id', { id })
        .getOne()
      originalData = await this.getOriginalImageData(id, image?.location)
      if (!originalData) {
        throw new GraphQLError('Image not found', { extensions: { code: '404' } })
      }

      let processedData: Buffer | null = null
      if (imageType === 'svg') {
        processedData = originalData
      } else {
        processedData = await this.processImageTransforms(originalData, imageInputs, imageType)
      }

      return processedData
    } catch (e) {
      if (e instanceof Error) {
        console.log(e?.stack)
      }
    }
  }

}
