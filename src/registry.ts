import { APIRegistry } from '@simple/api-registry'
import { InheritsPlugin } from '@simple/inherit-plugin'
import { RedisHelper } from '@lib/RedisHelper'

export const configure = async (): Promise<void> => {
  const registry = APIRegistry.shared()
  const interfaceDirectives = [
    'Simple',
    'Name',
    'Immutable',
    'Derived',
    'Layout',
  ]

  const fieldDirectives = [
    'Unique',
    'Immutable',
    'Searchable',
    'Derived',
  ]

  const inherits = new InheritsPlugin({ interfaceDirectives, fieldDirectives })
  registry.registerPlugin(inherits)

}
