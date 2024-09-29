import * as changeCase from 'change-case'
import { FileSchema } from './type.d'
import inquirer from 'inquirer'
import Helper from './Helper'
import ObjectBuilder from './ObjectBuilder'

enum Steps {
  Names = 'Names',
  RequireStorage = 'RequireStorage',
  RequireQueries = 'RequireQueries',
  RequireMutations = 'RequireMutations',
  ImplementsInterface = 'ImplmenetsInterface',
  GetInterface = 'GetInterface',
}

class AddModel extends Helper {

  schemaItem: FileSchema = {
    plural: '',
    singular: '',
    version: 2,
    implements: [],
    type: 'MODEL',
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

    const { hasStorage } = await this.getMenuOptionsForStep(Steps.RequireStorage)
    this.schemaItem.hasStorage = hasStorage

    if (hasStorage) {
      const { requiresQueries } = await this.getMenuOptionsForStep(Steps.RequireQueries)
      this.schemaItem.requiresQueries = requiresQueries

      const { requiresMutations } = await this.getMenuOptionsForStep(Steps.RequireMutations)
      this.schemaItem.requiresMutations = requiresMutations
    }

    const interfaces = this.getInterfaces()
    if (interfaces.length) {
      const { implementsInterface } = await this.getMenuOptionsForStep(Steps.ImplementsInterface)
      if (implementsInterface) {
        const { interfaces } = await this.getMenuOptionsForStep(Steps.GetInterface)
        this.schemaItem.implements = [changeCase.pascalCase(interfaces)]
      }
    }

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
      case Steps.RequireStorage:
        menuItems = [{
          type: 'confirm',
          name: 'hasStorage',
          message: 'Does this object require storage?',
        }]
        break
      case Steps.RequireQueries:
        menuItems = [{
          type: 'confirm',
          name: 'requiresQueries',
          message: 'Does this object require queries?',
        }]
        break
      case Steps.RequireMutations:
        menuItems = [{
          type: 'confirm',
          name: 'requiresMutations',
          message: 'Does this object require mutations?',
        }]
        break
      case Steps.ImplementsInterface:
        menuItems = [{
          type: 'confirm',
          name: 'implementsInterface',
          message: 'Does this object implement an interface?',
        }]
        break
      case Steps.GetInterface:
        menuItems = [{
          type: 'list',
          name: 'interfaces',
          message: 'Select which ones you want to implement',
          choices: this.getInterfaces().map((interfaceItem) => interfaceItem.singular),
        }]
        break
      default:
        break
    }
    return inquirer.prompt(menuItems)
  }

  getInterfaces(): FileSchema[] {
    return this.schemaItems.filter((schemaItem) => {
      return schemaItem.type === 'INTERFACE'
    })
  }

}

export default AddModel
