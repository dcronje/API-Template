import '../src/env'
import { buildSchema } from '../src/schema/schema'
import { FileSchema } from './type.d'
import path from 'path'
import fs from 'fs'
import { GQLRegistry } from 'gql-registry'
import { buildClientSchema, introspectionFromSchema, parse, print, printSchema } from 'graphql'
import Builder from './Builder'

class GenerateTypes extends Builder {

  readFile = (file: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(file, 'utf-8', (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  writeFile = (file: string, data: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(file, data, (err) => err ? reject(err) : resolve())
    })
  }

  async exportEnums(): Promise<void> {

    const filePath = path.join(__dirname, '../src/types/generated.ts')
    let data = await this.readFile(filePath)
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
    await this.writeFile(typesPath, newEnums)

  }

  async fixInputType(): Promise<void> {

    const filePath = path.resolve(__dirname, '../src/types/generated.ts')
    let fileData = await this.readFile(filePath)
    fileData = fileData.replace('export type InputMaybe<T> = Maybe<T>;', 'export type InputMaybe<T> = T | undefined;')
    await this.writeFile(filePath, fileData)

  }

  async begin(): Promise<FileSchema[]> {
    const registry: GQLRegistry = GQLRegistry.shared()
    await buildSchema()
    const executableSchema = await registry.getFederatableSchema()
    const introspection = introspectionFromSchema(executableSchema)
    const schema = buildClientSchema(introspection)
    const schemaNode = parse(printSchema(schema))
    const outputPath = path.resolve(__dirname, '../schema.graphql')
    const newSchema = print(schemaNode)
    await fs.writeFileSync(outputPath, newSchema)

    await this.exec('npm run codegen')
    await this.exportEnums()
    await this.fixInputType()
    return this.schemaItems
  }

}

export default GenerateTypes
