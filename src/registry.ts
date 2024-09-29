import { GQLRegistry } from 'gql-registry'
import { RedisHelper } from '@lib/RedisHelper'
import { GQLInheritsPlugin } from 'gql-inherit-plugin'

export const configure = async (): Promise<void> => {
  const registry = GQLRegistry.shared()
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

  const inherits = new GQLInheritsPlugin({ interfaceDirectives, fieldDirectives })
  registry.registerPlugin(inherits)

}
