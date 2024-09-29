import AWS, { AWSError } from 'aws-sdk'
import { Stream, Readable } from 'stream'
import { v4 } from 'uuid'
import path from 'path'
import { CredentialsOptions } from 'aws-sdk/lib/credentials'
import probe, { ProbeResult } from 'probe-image-size'
import toStream from 'buffer-to-stream'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { Image } from '@models/index'

interface AwsEnvConfigs {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
}

export interface FileUpload {
  fieldname: string
  originalname: string
  filename: string
  mimetype: string
  encoding: string
  createReadStream(): ReadStream
}

export interface ImageInfo {
  width: number
  height: number
  type: string
  orientation?: number
}

interface FileUploadResponse {
  location: string
  key: string
  bucket: string
  filename: string
  mimetype: string
  extension: string
}

interface ImageUpload extends FileUploadResponse {
  imageInfo: ImageInfo
}

export enum S3Buckets {
  IMAGES = 'IMAGES',
  ARCHIVES = 'ARCHIVES',
  PDFS = 'PDFS',
  EXCEL = 'EXCEL',
}

interface S3Response {
  location: string
  key: string
  bucket: string
  filename: string
  mimetype: string
  extension: string
}

class AWSHelper {

  buckets = {
    [S3Buckets.IMAGES]: process.env.AWS_S3_IMAGES_BUCKET || 'images',
    [S3Buckets.ARCHIVES]: process.env.AWS_S3_ARCHIVES_BUCKET || 'archives',
    [S3Buckets.PDFS]: process.env.AWS_S3_PDFS_BUCKET || 'pdfs',
    [S3Buckets.EXCEL]: process.env.AWS_SAWS_S3_EXCEL_BUCKET3_PDFS_BUCKET || 'excels',
  }

  static config(): AwsEnvConfigs {

    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = process.env as unknown as AwsEnvConfigs

    return {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    }

  }

  static credentials(): CredentialsOptions {

    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = this.config()

    const awsCredentials: CredentialsOptions = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
    return awsCredentials

  }

  static region(): string {
    const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
    return AWS_REGION
  }

  static version(): string {
    return '2010-12-01'
  }

  uploadToS3 = (bucket: string, key: string, mimetype: string, filename: string, stream: Readable | Buffer): Promise<S3Response> => {
    const awsCredentials = AWSHelper.credentials()
    const awsConfig = new AWS.Config({ credentials: awsCredentials, region: AWSHelper.region(), apiVersion: AWSHelper.version() })
    AWS.config.update(awsConfig)
    const s3 = new AWS.S3()
    return new Promise<S3Response>((resolve, reject) => {
      const pass = new Stream.PassThrough()
      const params = { Bucket: bucket, Key: key, ContentType: mimetype, Body: pass }
      s3.upload(params, (err: Error, data: any) => {
        const location = data?.Location
        if (err) {
          return reject(err)
        } else if (!location) {
          throw new Error('No response from S3')
        }
        resolve({ location, key, bucket, filename, mimetype, extension: path.extname(filename) })
      })
      if (stream instanceof Readable) {
        stream.pipe(pass)
      } else {
        const newStream = toStream(stream)
        newStream.pipe(pass)
      }
    })
  }

  async addImage(image: { file: FileUpload }): Promise<ImageUpload> {

    const BUCKET = process.env.AWS_S3_IMAGES_BUCKET ? process.env.AWS_S3_IMAGES_BUCKET : 'wms-test-images'
    const { createReadStream, filename, mimetype } = image.file
    const stream = createReadStream()
    const key = v4()
    const responseData = await this.uploadToS3(BUCKET, key, mimetype, filename, stream)
    const info = await this.imageSize(responseData.location)
    return { ...responseData, imageInfo: info }

  }

  async uploadFile(stream: Readable | Buffer, name: string, filename: string, mimetype: string, bucket: S3Buckets): Promise<File> {

    const key = v4()
    const responseData = await this.uploadToS3(this.buckets[bucket], key, mimetype, filename, stream)

    let newFile!: File
    switch (bucket) {
      case S3Buckets.IMAGES: {
        const imageInfo: ImageInfo = await this.imageSize(responseData.location)
        newFile = Image.create({
          location: responseData.location, key, bucket: this.buckets[bucket], filename, mimetype, extension: path.extname(filename), name, imageInfo,
        })
        await newFile.save()
        break
      }
    }
    return newFile

  }

  async destroyFile(file: File): Promise<void> {
    const awsCredentials = AWSHelper.credentials()
    const awsConfig = new AWS.Config({ credentials: awsCredentials, region: AWSHelper.region(), apiVersion: AWSHelper.version() })
    AWS.config.update(awsConfig)
    const s3 = new AWS.S3({ region: AWSHelper.region(), credentials: awsCredentials })
    return new Promise<void>((resolve, reject) => {
      s3.deleteObject({ Bucket: file.bucket, Key: file.key }, async (err: AWSError) => {
        if (err) {
          return reject(err)
        }
        resolve()
        await file.remove()
      })
    })
  }

  async removeImage(id: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const awsCredentials = AWSHelper.credentials()
      const BUCKET = process.env.AWS_S3_IMAGES_BUCKET ? process.env.AWS_S3_IMAGES_BUCKET : 'wms-test-images'
      const s3 = new AWS.S3({ region: AWSHelper.region(), credentials: awsCredentials })
      s3.deleteObject({ Bucket: BUCKET, Key: id }, (err: AWSError) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  async imageSize(imageUrl: string): Promise<ProbeResult> {
    const size = await probe(imageUrl)
    return size
  }

}

export default AWSHelper
