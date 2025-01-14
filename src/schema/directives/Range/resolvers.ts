import { mapSchema, MapperKind } from '@graphql-tools/utils'
import { GQLRegistry } from 'gql-registry'
import { GraphQLFieldConfig, GraphQLSchema, defaultFieldResolver, ListValueNode, ArgumentNode, StringValueNode, DirectiveNode, GraphQLArgumentConfig, TypeNode, GraphQLError, IntValueNode, Kind, InputValueDefinitionNode } from 'graphql'

const getNamedType = (type: TypeNode): string => {
  if (type.kind === 'NamedType') {
    return type.name.value
  } else if (type.kind === 'ListType') {
    return getNamedType(type.type)
  } else if (type.kind === 'NonNullType') {
    return getNamedType(type.type)
  }
  return ''
}

const getRange = (directive: DirectiveNode): { min?: number, max?: number } => {
  const minArgumnet = directive.arguments?.find((arg) => arg.name.value === 'min') as ArgumentNode
  const minValue = minArgumnet?.value as IntValueNode
  const min = minValue?.value
  const maxArgumnet = directive.arguments?.find((arg) => arg.name.value === 'max') as ArgumentNode
  const maxValue = maxArgumnet?.value as IntValueNode
  const max = maxValue?.value
  return { min: min !== undefined ? parseInt(min) : undefined, max: max !== undefined ? parseInt(max) : undefined }
}

const wrapFieldConfig = (fieldConfig: GraphQLFieldConfig<any, any>, schema: GraphQLSchema): GraphQLFieldConfig<any, any> => {
  const { resolve = defaultFieldResolver } = fieldConfig
  fieldConfig.resolve = async function (source, args, context, info) {
    if (fieldConfig?.args) {
      for (let i = 0; i < Object.keys(fieldConfig.args).length; i++) {
        const inputKey = Object.keys(fieldConfig.args)[i]
        const argument = fieldConfig.args[inputKey] as GraphQLArgumentConfig
        if (argument.astNode) {
          const astNode = argument.astNode as InputValueDefinitionNode
          if (astNode.type.kind === 'NamedType' && astNode.type.name.value === 'Int') {
            const directive = astNode.directives?.find((dir) => dir.name.value === 'IntRange')
            if (directive) {
              const { min, max } = getRange(directive)
              const value = args?.[astNode.name.value] as number | undefined
              if (value !== undefined) {
                if (min !== undefined && value < min) {
                  throw new GraphQLError(`The value for ${astNode.name.value} is less than the minimum allowed value of ${min}`)
                }
                if (max !== undefined && value > max) {
                  throw new GraphQLError(`The value for ${astNode.name.value} is greater than the maximum allowed value of ${max}`)
                }
              }
            }
          } else {
            const inputTypeName = getNamedType(argument.astNode.type)
            const inputType = schema.getType(inputTypeName)?.astNode
            if (inputType?.kind === 'InputObjectTypeDefinition') {
              const fields = inputType.fields
              if (fields) {
                for (let f = 0; f < fields.length; f++) {
                  const field = fields[f]
                  if (field.type.kind === 'NamedType' && field.type.name.value === 'Int') {
                    const directive = field?.directives?.find((dir) => dir.name.value === 'IntRange')
                    if (directive) {
                      const { min, max } = getRange(directive)
                      const value = args?.[astNode.name.value]?.[field.name.value] as number | undefined
                      if (value !== undefined) {
                        if (min !== undefined && value < min) {
                          throw new GraphQLError(`The value for ${astNode.name.value}.${field.name.value} is less than the minimum allowed value of ${min}`)
                        }
                        if (max !== undefined && value > max) {
                          throw new GraphQLError(`The value for ${astNode.name.value}.${field.name.value} is greater than the maximum allowed value of ${max}`)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const result = await resolve(source, args, context, info)
    return result
  }
  return fieldConfig
}

function permissionDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.QUERY_ROOT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string, typeName: string) => {
      return wrapFieldConfig(fieldConfig, schema)
    },

    [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string, typeName: string, _schema: GraphQLSchema) => {
      return wrapFieldConfig(fieldConfig, schema)
    },

    [MapperKind.MUTATION_ROOT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string, typeName: string) => {
      return wrapFieldConfig(fieldConfig, schema)
    },
    // TODO: Build permissions into Simple
  })
}

const registry = GQLRegistry.shared()
registry.registerDirectives({
  directiveResolvers: {
    IntRange: permissionDirectiveTransformer,
  },
})
