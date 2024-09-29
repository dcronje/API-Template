import { mapSchema, MapperKind } from '@graphql-tools/utils'
import { APIRegistry } from '@simple/api-registry'
import { GraphQLFieldConfig, GraphQLSchema, defaultFieldResolver, ListValueNode, ArgumentNode, StringValueNode, DirectiveNode, GraphQLArgumentConfig, TypeNode, GraphQLError } from 'graphql'

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

const getPermissionTypes = (directive: DirectiveNode): string[] => {
  const argument = directive.arguments?.find((arg) => arg.name.value === 'types') as ArgumentNode
  const typeValues = argument.value as ListValueNode
  const types = typeValues.values.map((val) => (val as StringValueNode).value)
  return types
}

function permissionDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.QUERY_ROOT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string) => {
      const directive = fieldConfig.astNode?.directives?.find((dir) => dir.name.value === 'Permissions')
      if (directive) {
        const types = getPermissionTypes(directive)
        const { resolve = defaultFieldResolver } = fieldConfig
        fieldConfig.resolve = async function (source, args, context, info) {
          const user = context.user
          for (let t = 0; t < types.length; t++) {
            const hasPermissions = await user?.hasPermission?.(types[t])
            if (!hasPermissions) {
              throw new GraphQLError(`You do not have permission to query ${fieldName}`)
            }
          }
          const result = await resolve(source, args, context, info)
          return result
        }
        return fieldConfig
      }
    },

    [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string, typeName: string, _schema: GraphQLSchema) => {
      const directive = fieldConfig.astNode?.directives?.find((dir) => dir.name.value === 'Permissions')
      if (directive) {
        const types = getPermissionTypes(directive)
        const { resolve = defaultFieldResolver } = fieldConfig
        fieldConfig.resolve = async function (source, args, context, info) {
          const user = context.user
          for (let t = 0; t < types.length; t++) {
            const hasPermissions = await user?.hasPermission?.(types[t])
            if (!hasPermissions) {
              throw new GraphQLError(`You do not have permission to query ${fieldName} on ${typeName}`)
            }
          }
          const result = await resolve(source, args, context, info)
          return result
        }
        return fieldConfig
      }
      const type = _schema.getType(typeName)
      const typeDirective = type?.astNode?.directives?.find((dir) => dir.name.value === 'Permissions')
      if (typeDirective) {
        const types = getPermissionTypes(typeDirective)
        const { resolve = defaultFieldResolver } = fieldConfig
        fieldConfig.resolve = async function (source, args, context, info) {
          const user = context.user
          for (let t = 0; t < types.length; t++) {
            const hasPermissions = await user?.hasPermission?.(types[t])
            if (!hasPermissions) {
              throw new GraphQLError(`You do not have permission to access ${type?.astNode?.name.value}`)
            }
          }
          const result = await resolve(source, args, context, info)
          return result
        }
        return fieldConfig
      }
    },

    [MapperKind.MUTATION_ROOT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>, fieldName: string) => {
      const { resolve = defaultFieldResolver } = fieldConfig
      fieldConfig.resolve = async function (source, args, context, info) {
        const user = context.user

        const directive = fieldConfig.astNode?.directives?.find((dir) => dir.name.value === 'Permissions')
        if (directive) {
          const types = getPermissionTypes(directive)
          for (let t = 0; t < types.length; t++) {
            const hasPermissions = await user?.hasPermission?.(types[t])
            if (!hasPermissions) {
              throw new GraphQLError(`You do not have permission to mutate ${fieldName}`)
            }
          }
        }

        if (fieldConfig?.args) {
          for (let i = 0; i < Object.keys(fieldConfig.args).length; i++) {
            const inputKey = Object.keys(fieldConfig.args)[i]
            const argument = fieldConfig.args[inputKey] as GraphQLArgumentConfig
            if (argument.astNode) {
              const inputTypeName = getNamedType(argument.astNode.type)
              const inputType = schema.getType(inputTypeName)?.astNode
              if (inputType?.kind === 'InputObjectTypeDefinition') {
                const directive = inputType?.directives?.find((dir) => dir.name.value === 'Permissions')
                if (directive) {
                  const types = getPermissionTypes(directive)
                  for (let t = 0; t < types.length; t++) {
                    const hasPermissions = await user?.hasPermission?.(types[t])
                    if (!hasPermissions) {
                      throw new GraphQLError(`You do not have permission to use ${inputType.name.value}`)
                    }
                  }
                }
                const fields = inputType.fields
                if (fields) {
                  for (let f = 0; f < fields.length; f++) {
                    const field = fields[f]
                    const directive = field?.directives?.find((dir) => dir.name.value === 'Permissions')
                    if (directive) {
                      const types = getPermissionTypes(directive)
                      for (let t = 0; t < types.length; t++) {
                        const hasPermissions = await user?.hasPermission?.(types[t])
                        if (!hasPermissions) {
                          throw new GraphQLError(`You do not have permission to use ${field.name.value} on ${inputType.name.value}`)
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
    },
    // TODO: Build permissions into Simple
  })
}

const registry = APIRegistry.shared()
registry.registerDirectives({
  directiveResolvers: {
    Permissions: permissionDirectiveTransformer,
  },
})
