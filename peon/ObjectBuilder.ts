import path from 'path'
import { FileSchema } from './type.d'
import InterfaceBuilder from './InterfaceBuilder'
import ModelBuilder from './ModelBuilder'
import Builder from './Builder'

class ObjectBuilder extends Builder {

  async buildFromSchemaItem(schemaItem: FileSchema): Promise<void> {
    await this.checkDirectory(path.join(__dirname, `../src/generated/${schemaItem.names.UCFSingular}`))
    await this.checkDirectory(path.join(__dirname, `../src/schema/types/${schemaItem.names.UCFSingular}`))
    switch (schemaItem.type) {
      case 'INTERFACE':
        await new InterfaceBuilder(this.schemaItems).buildFromSchemaItem(schemaItem)
        break
      case 'MODEL':
        await new ModelBuilder(this.schemaItems).buildFromSchemaItem(schemaItem)
        break
      default:
        break
    }
    // await new GenerateTypes(this.schemaItems).begin()
  }

}

export default ObjectBuilder
