import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'
import { ObjectTypeDefinitionNode, printSchema, UnionTypeDefinitionNode } from 'graphql'

const getInterfaceTypes = async () => {
  const apiRegistry = APIRegistry.shared()
  const executableSchema = await apiRegistry.getFederatableSchema()
  const schema = gql`${printSchema(executableSchema)}`
  const interfaces: { [k: string]: string[] } = {}
  for (let d = 0; d < schema.definitions.length; d++) {
    if (schema.definitions[d].kind === 'ObjectTypeDefinition') {
      const objectDefinition = schema.definitions[d] as ObjectTypeDefinitionNode
      if (objectDefinition.interfaces) {
        for (let i = 0; i < objectDefinition.interfaces.length; i++) {
          if (!interfaces[objectDefinition.interfaces[i].name.value]) {
            interfaces[objectDefinition.interfaces[i].name.value] = []
          }
          // @ts-ignore
          interfaces[objectDefinition.interfaces[i].name.value].push(schema.definitions[d].name.value)
        }
      }
    } else if (schema.definitions[d].kind === 'UnionTypeDefinition') {
      const unionDefinition = schema.definitions[d] as UnionTypeDefinitionNode
      if (unionDefinition.types) {
        for (let i = 0; i < unionDefinition.types.length; i++) {
          if (!interfaces[unionDefinition.name.value]) {
            interfaces[unionDefinition.name.value] = []
          }
          // @ts-ignore
          interfaces[unionDefinition.name.value].push(unionDefinition.types[i].name.value)
        }
      }
    }
  }
  const types = Object.keys(interfaces).map((name) => {
    const objects = interfaces[name]
    return {
      kind: 'INTERFACE',
      name,
      possibleTypes: objects.map((objectName) => ({ name: objectName })),
    }
  })
  return types
}

const apiRegistry = APIRegistry.shared()
apiRegistry.registerType({
  queryResolvers: {
    getInterfaceTypes,
  },
})
