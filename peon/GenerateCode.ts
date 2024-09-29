import { FileSchema } from './type.d'
import Builder from './Builder'
import ObjectBuilder from './ObjectBuilder'
import path from 'path'
import fs from 'fs'

class GenerateCode extends Builder {

  async exportEnums(): Promise<void> {

    const readFile = (file: string): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        fs.readFile(file, 'utf-8', (err, data) => {
          if (err) return reject(err)
          resolve(data)
        })
      })
    }

    const writeFile = (file: string, data: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        fs.writeFile(file, data, (err) => err ? reject(err) : resolve())
      })
    }

    const filePath = path.join(__dirname, '../src/types/generated.ts')
    let data = await readFile(filePath)
    let newEnums = ''
    // console.log(data)
    let safety = 500
    let match = data.match(/export enum (.*?) \{(.*?)\}/s)
    while (match && safety) {
      const newEnum = `export enum ${match[1]} {${match[2].split('\n').map((line) => `  ${line.trim()}`).join('\n')}\n}`
      newEnums += newEnum + '\n\n'
      data = data.replace(/export enum (.*?) \{(.*?)\}/s, '')
      match = data.match(/export enum (.*?) \{(.*?)\}/s)
      safety--
    }

    const typesPath = path.join(__dirname, '../src/enums.ts')
    await writeFile(typesPath, newEnums)

  }

  async begin(): Promise<FileSchema[]> {
    await this.exportEnums()
    const objectBuilder = new ObjectBuilder(this.schemaItems)
    for (let s = 0; s < this.schemaItems.length; s++) {
      await objectBuilder.buildFromSchemaItem(this.schemaItems[s])
    }
    return this.schemaItems
  }

}

export default GenerateCode
