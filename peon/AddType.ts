import { FileSchema } from './type.d'
import Helper from './Helper'
import AddInterface from './AddInterface'
import AddModel from './AddModel'
import inquirer from 'inquirer'

enum RootMenuOptions {
  Interface = 'Interface',
  Model = 'Model'
}

class AddType extends Helper {

  async begin(): Promise<FileSchema[]> {
    const { ACTION } = await this.getRootMenuOption() as { ACTION: string }
    switch (ACTION) {
      case RootMenuOptions.Interface:
        await this._handleAddInreface()
        break
      case RootMenuOptions.Model:
        await this._handleAddModel()
        break
      default:
        break
    }
    return this.schemaItems
  }

  async getRootMenuOption() {
    const questions = [{
      type: 'list',
      name: 'ACTION',
      message: 'What kind of object would you like to add?',
      choices: [
        'Interface',
        'Model',
      ],
    }]
    return inquirer.prompt(questions)
  }

  async _handleAddInreface() {
    const addInterface = new AddInterface(this.schemaDirectory, this.schemaItems)
    return addInterface.begin()
  }

  async _handleAddModel() {
    const addModel = new AddModel(this.schemaDirectory, this.schemaItems)
    return addModel.begin()
  }

}

export default AddType
