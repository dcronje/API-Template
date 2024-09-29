import './env'
import { FileSchema } from './type.d'
import AddType from './AddType'
import Generate from './Generate'
import path from 'path'
import { PathLike } from 'fs'
import inquirer from 'inquirer'
import Helper from './Helper'
import Admin from './Admin'

enum RootMenuOptions {
  AddType = 'Add Type',
  Generate = 'Generate',
  AddAdmin = 'Add Admin',
}

interface MenuOptions {
  type: string
  name: string
  message: string
  choices: string[]
}

class Peon extends Helper {

  async writeSchemaItems(schemaItems: FileSchema[]): Promise<void> {
    for (let s = 0; s < schemaItems.length; s++) {
      await this.writeSchemaItem(this.schemaDirectory, schemaItems[s])
    }
    this.schemaItems = schemaItems
  }

  async loadSchemaItems(): Promise<FileSchema[]> {
    const schema: FileSchema[] = []
    const files = await this.readDirectory(this.schemaDirectory)
    for (let f = 0; f < files.length; f++) {
      if (path.extname(files[f]) === '.json') {
        const filePath = path.join(this.schemaDirectory.toString(), files[f])
        const schemaItem = await this.loadFile(filePath)
        await this.coerceSchemaVersion(this.schemaDirectory, schemaItem)
        schema.push(schemaItem)
      }
    }
    return schema
  }

  async begin(): Promise<void> {
    this.schemaItems = await this.loadSchemaItems()
    const { ACTION } = await this.getRootMenuOption() as { ACTION: string }
    switch (ACTION) {
      case RootMenuOptions.AddType:
        await this._handleAddType()
        break
      case RootMenuOptions.Generate:
        await this._handleGenerate()
        break
      case RootMenuOptions.AddAdmin:
        await this._handleAddAdmin()
        break
      default:
        break
    }
  }

  async coerceSchemaVersion(filePath: PathLike, schemaItem: FileSchema): Promise<void> {
    if (!schemaItem.version) {
      schemaItem.version = 1
    }
    if (schemaItem.version < 2) {
      schemaItem.version = 2
      schemaItem.requiresMutations = true
      schemaItem.requiresQueries = true
      await this.writeSchemaItem(filePath, schemaItem)
    }
  }

  async getRootMenuOption(): Promise<any> {
    const questions: MenuOptions[] = [{
      type: 'list',
      name: 'ACTION',
      message: 'Something need doing?',
      choices: [
        'Add Type',
        'Generate',
        'Add Admin',
        'Generate Random Carts',
      ],
    }]
    return inquirer.prompt(questions)
  }

  async _handleAddType(): Promise<void> {
    const addType = new AddType(this.schemaDirectory, this.schemaItems)
    const schemaItems = await addType.begin()
    this.writeSchemaItems(schemaItems)
  }

  async _handleGenerate(): Promise<void> {
    const generate = new Generate(this.schemaDirectory, this.schemaItems)
    const schemaItems = await generate.begin()
    this.writeSchemaItems(schemaItems)
  }

  async _handleAddAdmin(): Promise<void> {
    const admin = new Admin()
    admin.begin()
  }

  async generateAll(): Promise<void> {
    this.schemaItems = await this.loadSchemaItems()
    const generate = new Generate(this.schemaDirectory, this.schemaItems)
    const schemaItems = await generate.begin(true)
    await this.writeSchemaItems(schemaItems)
  }

}

export default Peon
