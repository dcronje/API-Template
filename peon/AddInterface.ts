import * as changeCase from 'change-case'
import { FileSchema } from './type.d'
import inquirer from 'inquirer'
import Helper from './Helper'
import ObjectBuilder from './ObjectBuilder'

enum Steps {
  Names = 'Names',
}

class AddInterface extends Helper {

  schemaItem: FileSchema = {
    plural: '',
    singular: '',
    version: 3,
    implements: [],
    type: 'INTERFACE',
    hasStorage: true,
    requiresMutations: false,
    requiresQueries: true,
    names: {
      UCFPlural: '',
      UCFSingular: '',
      LCFPlural: '',
      LCFSingular: '',
    },
  }

  async begin(): Promise<FileSchema[]> {
    const { singular, plural } = await this.getMenuOptionsForStep(Steps.Names)
    const names = {
      UCFSingular: changeCase.pascalCase(singular),
      LCFSingular: changeCase.camelCase(singular),
      UCFPlural: changeCase.pascalCase(plural),
      LCFPlural: changeCase.camelCase(plural),
    }
    this.schemaItem.singular = singular
    this.schemaItem.plural = plural
    this.schemaItem.names = names

    const objectBuilder = new ObjectBuilder()
    objectBuilder.buildFromSchemaItem(this.schemaItem)
    this.schemaItems.push(this.clone(this.schemaItem))
    return this.schemaItems
  }

  async getMenuOptionsForStep(step: Steps): Promise<any> {
    let menuItems: inquirer.Questions = []
    switch (step) {
      case Steps.Names:
        menuItems = [{
          type: 'input',
          name: 'singular',
          message: 'Please enter the singular name for the Entity',
        }, {
          type: 'input',
          name: 'plural',
          message: 'Please enter the plural name for the Entity',
        }]
        break
      default:
        break
    }
    return inquirer.prompt(menuItems)
  }

}

export default AddInterface
