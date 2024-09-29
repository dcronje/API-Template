import { EnumDescription } from '@root/types/generated'
import { APIRegistry } from '@simple/api-registry'
import { GraphQLResolveInfo, GraphQLInputObjectType, isInputObjectType, getNullableType, isRequiredInputField, isListType, getNamedType, isEnumType } from 'graphql'

const parseDetailedInputObject = (inputObject?: GraphQLInputObjectType): any => {
  const response: any = {}
  if (inputObject) {
    const fields = inputObject.getFields()
    Object.keys(fields).forEach((key) => {
      const field = fields[key]
      if (isEnumType(getNullableType(field.type))) {
        response[key] = { type: 'String', required: isRequiredInputField(field) }
      } else if (isInputObjectType(getNullableType(field.type))) {
        response[key] = { type: parseDetailedInputObject(getNamedType(field.type) as GraphQLInputObjectType), required: isRequiredInputField(field) }
      } else if (isListType(getNullableType(field.type))) {
        if (isInputObjectType(getNamedType(field.type))) {
          response[key] = { type: [parseDetailedInputObject(getNamedType(field.type) as GraphQLInputObjectType)], required: isRequiredInputField(field) }
        } else {
          response[key] = { type: [getNamedType(field.type)], required: isRequiredInputField(field) }
        }
      } else {
        response[key] = { type: getNullableType(field.type), required: isRequiredInputField(field) }
      }
    })
  }
  return response
}

const parseInputObject = (inputObject?: GraphQLInputObjectType): any => {
  const response: any = {}
  if (inputObject) {
    const fields = inputObject.getFields()
    Object.keys(fields).forEach((key) => {
      const field = fields[key]
      if (isInputObjectType(getNullableType(field.type))) {
        response[key] = parseInputObject(field.type as GraphQLInputObjectType)
      } else {
        response[key] = true
      }
    })
  }
  return response
}

const queryResolvers = {
  getInputObjectConfig: (obj: any, args: any, ctx: GQLContext, info: GraphQLResolveInfo): Array<EnumDescription | null> => {
    return parseInputObject(info.schema.getType(args.name) as GraphQLInputObjectType)
  },
  getDetailedInputObjectConfig: (obj: any, args: any, ctx: GQLContext, info: GraphQLResolveInfo): Array<EnumDescription | null> => {
    return parseDetailedInputObject(info.schema.getType(args.name) as GraphQLInputObjectType)
  },
}

const registry = APIRegistry.shared()
registry.registerType({
  queryResolvers,
})
