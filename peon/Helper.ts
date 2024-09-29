import path from 'path'
import { FileSchema } from './type.d'
import fs, { PathLike } from 'fs'

class Helper {

  schemaDirectory!: PathLike
  schemaItems!: FileSchema[]

  constructor(schemaDirectory: PathLike, schemaItems: FileSchema[] = []) {
    this.schemaDirectory = schemaDirectory
    this.schemaItems = schemaItems
  }

  clone(data: any): any {
    return JSON.parse(JSON.stringify(data))
  }

  async loadFile(filePath: PathLike): Promise<FileSchema> {
    return new Promise<FileSchema>((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          return reject(err)
        }
        resolve(JSON.parse(data) as FileSchema)
      })
    })
  }

  async readDirectory(directoryPath: PathLike): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(directoryPath, (err: NodeJS.ErrnoException | null, contence: string[]) => {
        if (err) {
          return reject(err)
        }
        resolve(contence)
      })
    })
  }

  async writeSchemaItem(filePath: PathLike, scheamItem: FileSchema): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path.join(filePath.toString(), `./${scheamItem.names.UCFSingular}.json`), JSON.stringify(scheamItem, null, 2), (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

}

export default Helper
