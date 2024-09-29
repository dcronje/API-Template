import fs, { PathLike } from 'fs'
import path from 'path'
import { FileSchema } from './type.d'
import { exec } from 'child_process'

class Builder {

  schemaItems!: FileSchema[]

  constructor(schemaItems: FileSchema[] = []) {
    this.schemaItems = schemaItems
  }

  async getSchemaForType(singularName: string): Promise<FileSchema> {
    const filePath = path.join(__dirname, `../schema/${singularName}.json`)
    return new Promise<FileSchema>((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          return reject(err)
        }
        resolve(JSON.parse(data) as FileSchema)
      })
    })
  }

  async checkDirectory(directoryPath: PathLike): Promise<void> {
    if (!await this.fileExists(directoryPath)) {
      await this.createDirectory(directoryPath)
    }
  }

  async createDirectory(directoryPath: PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.mkdir(directoryPath, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  async fileExists(filePath: PathLike): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.exists(filePath, (exists) => {
        resolve(exists)
      })
    })
  }

  async writeToFile(code: string, filePath: PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(filePath, code, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  getSchemaFileDirectory(schemaItem: FileSchema): PathLike {
    return path.join(__dirname, '../schema')
  }

  async exec(command: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      exec(command, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

}

export default Builder
