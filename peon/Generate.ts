import { FileSchema } from './type.d'
import Helper from './Helper'
import GenerateCode from './GenerateCode'
import GenerateTypes from './GenerateTypes'
import ora from 'ora'
import inquirer from 'inquirer'

enum RootMenuOptions {
  Code = 'Code',
  Types = 'Types',
  Both = 'Both',
}

class Generate extends Helper {

  async begin(both = false): Promise<FileSchema[]> {

    let ACTION = RootMenuOptions.Both as string
    if (!both) {
      const result = await this.getRootMenuOption() as { ACTION: string }
      ACTION = result.ACTION
    }

    switch (ACTION) {
      case RootMenuOptions.Code:
        await this._handleGenerateCode()
        break
      case RootMenuOptions.Types:
        await this._handleGenerateTypes()
        break
      case RootMenuOptions.Both:
        await this._handleGenerateTypes()
        await this._handleGenerateCode()
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
      message: 'What would you like to generate?',
      choices: [
        'Code',
        'Types',
        'Both',
      ],
    }]
    return inquirer.prompt(questions)
  }

  async _handleGenerateCode() {
    const spin = ora({
      text: 'Generating the boilerplate',
      color: 'magenta',
      spinner: {
        interval: 200,
        frames: ['▹▹▹', '▸▹▹', '▹▸▹', '▹▹▸'],
      },
    }).start()
    // spin.succeed()
    try {
      await new GenerateCode(this.schemaItems).begin()
      spin.succeed()
    } catch (error) {
      console.log(error)
      spin.fail(error)
    }

  }

  async _handleGenerateTypes() {
    const spin = ora({
      text: 'Generating the typescript hints',
      color: 'magenta',
      spinner: {
        interval: 200,
        frames: ['▹▹▹', '▸▹▹', '▹▸▹', '▹▹▸'],
      },
    }).start()
    // spin.succeed()
    try {
      await new GenerateTypes(this.schemaItems).begin()
      spin.succeed()
    } catch (error) {
      console.log(error)
      spin.fail(error)
    }
  }

}

export default Generate
