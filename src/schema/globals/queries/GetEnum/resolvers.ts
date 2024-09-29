import { QueryGetEnumsArgs, EnumDescription, EnumValue, QueryGetEnumArgs } from '@root/types/generated'
import { GQLRegistry } from 'gql-registry'
import { GraphQLResolveInfo, GraphQLEnumType, GraphQLEnumValue } from 'graphql'

const queryResolvers = {
  getEnums: (obj: any, args: QueryGetEnumsArgs, ctx: GQLContext, info: GraphQLResolveInfo): Array<EnumDescription | null> => {
    const { enums = [] } = args
    const response: EnumDescription[] = [] as EnumDescription[]
    (enums as (string | null)[]).forEach((enumOption: string | null) => {
      if (enumOption) {
        const type = info.schema.getType(enumOption) as GraphQLEnumType
        if (type) {
          const enumDef: EnumDescription = {
            name: type.name,
            description: type.description ? type.description! : '',
            values: type.getValues().map((enumInfo: GraphQLEnumValue) => {
              return {
                title: enumInfo.description,
                value: enumInfo.value,
              }
            }) as EnumValue[],
          }
          response.push(enumDef)
        }
      }
    })
    return response
  },
  getEnum: (obj: any, args: QueryGetEnumArgs, ctx: GQLContext, info: GraphQLResolveInfo): EnumDescription | null => {
    let response: EnumDescription | null = null
    const type = info.schema.getType(args.enum) as GraphQLEnumType
    if (type) {
      const enumDef: EnumDescription = {
        name: type.name,
        description: type.description ? type.description! : '',
        values: type.getValues().map((enumInfo: GraphQLEnumValue) => {
          return {
            title: enumInfo.description,
            value: enumInfo.value,
          }
        }) as EnumValue[],
      }
      response = enumDef
    }
    return response
  },
}

const registry = GQLRegistry.shared()
registry.registerType({
  queryResolvers,
})
