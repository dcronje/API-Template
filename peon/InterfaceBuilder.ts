import * as changeCase from 'change-case'
import path from 'path'
import { FileSchema } from './type.d'
import Builder from './Builder'
import CodeGen from './CodeGen'
import { PathLike } from 'fs'

class InterfaceBuilder extends Builder {

  async buildFromSchemaItem(schemaItem: FileSchema): Promise<void> {
    const { UCFSingular } = schemaItem.names
    const databaseModelPath = path.resolve(`src/models/${UCFSingular}.ts`)
    const schemaPath = path.resolve(`src/schema/types/${UCFSingular}/${UCFSingular}Schema.ts`)
    const resolversPath = path.resolve(`src/schema/types/${UCFSingular}/${UCFSingular}Resolvers.ts`)
    const generatedClassPath = path.resolve(`src/generated/${UCFSingular}/${UCFSingular}ResolversGenerated.ts`)
    const generatedSchemaPath = path.resolve(`src/generated/${UCFSingular}/schema.ts`)
    const generatedResolversPath = path.resolve(`src/generated/${UCFSingular}/resolvers.ts`)
    if (!await this.fileExists(databaseModelPath) && schemaItem.hasStorage) {
      await this.buildDatabaseModel(schemaItem, databaseModelPath)
    }
    if (!await this.fileExists(schemaPath)) {
      await this.buildSchema(schemaItem, schemaPath)
    }
    if (!await this.fileExists(resolversPath)) {
      await this.buildResoler(schemaItem, resolversPath)
    }
    await this.buildGeneratedClass(schemaItem, generatedClassPath)
    await this.buildGeneratedSchema(schemaItem, generatedSchemaPath)
    await this.buildGeneratedResoler(schemaItem, generatedResolversPath)
  }

  async buildDatabaseModel(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    code.addBlock(`
      import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, TableInheritance, CreateDateColumn, UpdateDateColumn } from 'typeorm'
      
      @Entity('${changeCase.snakeCase(LCFSingular)}')
      @TableInheritance({ column: { type: "varchar", name: "type" } })
      export class ${UCFSingular} extends BaseEntity {
      
        @PrimaryGeneratedColumn('uuid')
        id!: string
      
        @Column({ type: 'varchar' })
        name!: string
      
        @CreateDateColumn({ type: 'timestamptz' })
        createdAt: Date = new Date()
      
        @UpdateDateColumn({  type: 'timestamptz' })
        updatedAt: Date = new Date()
      
      }
    `)

    return this.writeToFile(code.toString(), filePath)
  }

  async buildSchema(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural } = schemaItem.names
    const code = new CodeGen()

    if (schemaItem.hasStorage) {
      code.addBlock(`
        import { GQLRegistry } from 'gql-registry'
        import gql from 'graphql-tag'
        
        class ${UCFSingular}Schema {
        
          register(registry: GQLRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
              queryDefinitions: this.queryDefinitions,
            })
          }

          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            interface ${UCFSingular} {
              """The ${UCFSingular}'s ID"""
              id: ID!
              name: String!
              """The creation date of the Model"""
              createdAt: DateTime
              """The update date of the Model"""
              updatedAt: DateTime
            }

            """Fields available to order Properties"""
            enum ${UCFSingular}OrderEnum {
              "Name"
              NAME
              "Created At"
              CREATED_AT
              "Updated At"
              UPDATED_AT
            }

            """${UCFSingular} filtering options"""
            input ${UCFSingular}Filters {
              search: String
              id: ID
              ids: [ID!]
              minCreatedAt: DateTime
              maxCreatedAt: DateTime
              createdAt: DateTime
              minUpdatedAt: DateTime
              maxUpdatedAt: DateTime
              updatedAt: DateTime
            }

            """${UCFSingular} ordering options"""
            input ${UCFSingular}Order {
              """Order field"""
              field: ${UCFSingular}OrderEnum
              """Order direction"""
              direction: OrderDirectionEnum
            }

            """Properties list object"""
            type ${UCFSingular}List {
              """A list of Properties"""
              list: [${UCFSingular}!]!
              """A count of Properties"""
              count: Int!
              """Number of ${UCFSingular} records skipped"""
              skip: Int!
              """Number of ${UCFSingular} records returned"""
              limit: Int!
            }

          \`

          queryDefinitions = gql\`
            type Query {
              """Get a list of ${UCFPlural} with order and filtering options"""
              all${UCFPlural}(skip: Int, limit: Int, filters: ${UCFSingular}Filters, order: [${UCFSingular}Order]): ${UCFSingular}List!

              """Get a specific ${UCFSingular} by ID"""
              one${UCFSingular}(id: ID!): ${UCFSingular}!

              """Get a count of ${UCFSingular} with filtering options"""
              count${UCFPlural}(filters: ${UCFSingular}Filters): Int!
            }

          \`

        }

        export default ${UCFSingular}Schema

      `)

      return this.writeToFile(code.toString(), filePath)
    }

    code.addBlock(`
      import { GQLRegistry } from 'gql-registry'
      import gql from 'graphql-tag'
      
      class ${UCFSingular}Schema {
      
        register(registry: GQLRegistry): void {
          registry.registerType({
            typeDefinitions: this.typeDefinitions,
          })
        }

        typeDefinitions = gql\`
          """Represents a ${UCFSingular} in the system"""
          interface ${UCFSingular} {
            name: String!
            """The creation date of the Model"""
            createdAt: DateTime
            """The update date of the Model"""
            updatedAt: DateTime
          }

        \`

      }

      export default ${UCFSingular}Schema

    `)

    return this.writeToFile(code.toString(), filePath)

  }

  async buildResoler(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural } = schemaItem.names
    const code = new CodeGen()

    if (schemaItem.hasStorage) {
      code.addBlock(`
        import { GQLRegistry } from 'gql-registry'
        import { PermissionRegistry } from '@lib/PermissionRegistry'
        import { SelectQueryBuilder } from 'typeorm'
        import { ${UCFSingular} } from '@models/index'
        import changeCase from 'change-case'
        import ${UCFSingular}ResolversGenerated from '@generated/${UCFSingular}/${UCFSingular}ResolversGenerated'
        import { GraphQLResolveInfo } from 'graphql'
        import { ${UCFSingular}Filters, ${UCFSingular}Order, ${UCFSingular} as API${UCFSingular} } from '@root/types/generated'

        class ${UCFSingular}Resolvers extends ${UCFSingular}ResolversGenerated {
        
          register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
            const queryResolvers = {
              all${UCFPlural}: this.all${UCFPlural},
              one${UCFSingular}: this.one${UCFSingular},
              count${UCFPlural}: this.count${UCFPlural},
            }
            registry.registerType({
              queryResolvers,
              interfaceResolvers: this.interfaceResolvers,
            })
          }
        
          interfaceResolvers = {
            ${UCFSingular}: {
              __resolveType(obj: ${UCFSingular}, ctx: GQLContext, info: GraphQLResolveInfo) {
                if (obj instanceof ${UCFSingular}) {
                  return '${UCFSingular}'
                }
                return null
              }
            }
          }
        
          static async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {
            if (filters.minCreatedAt) {
              qry.andWhere(\`"createdAt" >= :minCreatedAt\`, { minCreatedAt: filters.minCreatedAt })
            }
            return
          }
        
          static async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          
          }

          async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {
            return ${UCFSingular}Resolvers.apply${UCFSingular}Filters(qry, filters)
          }

          async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
            await ${UCFSingular}Resolvers.apply${UCFSingular}Order(qry, order)
          }
        
        }
        
        export default ${UCFSingular}Resolvers
      `)

      return this.writeToFile(code.toString(), filePath)
    }

    code.addBlock(`
      import { GQLRegistry } from 'gql-registry'
      import { PermissionRegistry } from '@lib/PermissionRegistry'
      import { SelectQueryBuilder } from 'typeorm'
      import changeCase from 'change-case'
      import ${UCFSingular}ResolversGenerated from '@generated/${UCFSingular}/${UCFSingular}ResolversGenerated'
      import { GraphQLResolveInfo } from 'graphql'

      class ${UCFSingular}Resolvers extends ${UCFSingular}ResolversGenerated {
      
        register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
          registry.registerType({
            interfaceResolvers: this.interfaceResolvers,
          })
        }

        interfaceResolvers = {
          ${UCFSingular}: {
            __resolveType(obj: ${UCFSingular}, ctx: GQLContext, info: GraphQLResolveInfo) {
              if (obj instanceof ${UCFSingular}) {
                return '${UCFSingular}'
              }
              return null
            }
          }
        }
      
      }
      
      export default ${UCFSingular}Resolvers
    `)

    return this.writeToFile(code.toString(), filePath)
  }

  async buildGeneratedClass(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural, LCFPlural, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    if (schemaItem.hasStorage) {
      code.addBlock(`
        import { SelectQueryBuilder } from 'typeorm'
        import { AppDataSource } from '@root/data-source'
        import { ${UCFSingular} } from '@models/index'
        import { GraphQLResolveInfo } from 'graphql'
        import { ReadStream } from 'typeorm/platform/PlatformTools'
        import { ${UCFSingular}List, QueryAll${UCFPlural}Args, QueryOne${UCFSingular}Args, QueryCount${UCFPlural}Args, ${UCFSingular}Filters, ${UCFSingular}Order, ${UCFSingular} as API${UCFSingular} } from '@root/types/generated'
        
        class ${UCFSingular}ResolversGenerated {

          constructor() {
            this.all${UCFPlural} = this.all${UCFPlural}.bind(this)
            this.one${UCFSingular} = this.one${UCFSingular}.bind(this)
            this.count${UCFPlural} = this.count${UCFPlural}.bind(this)
          }
        
          async all${UCFPlural}(obj: any | null, args: QueryAll${UCFPlural}Args = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<${UCFSingular}List> {
            const { filters = {}, order = [], skip = 0, limit = parseInt(process.env.DEFAULT_QUERY_LIMIT!) } = args
            const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
            await this.apply${UCFSingular}Filters(qry, filters)
            const count = await qry.getCount()
            await this.apply${UCFSingular}Order(qry, order as Array<${UCFSingular}Order>)
            qry.limit(limit).skip(skip)
            const list = async function* (): AsyncIterable<API${UCFSingular}> {
              const dataStream: ReadStream = await qry
                .stream()
              for await (const chunk of dataStream) {
                Object.keys(chunk).forEach((key) => {
                  chunk[key.replace('${UCFSingular}_', '')] = chunk[key]
                })
                yield AppDataSource.getRepository(chunk.type).create(chunk) as unknown as API${UCFSingular}
              }
              return
            }

            return {
              list: list as unknown as API${UCFSingular}[],
              count,
              skip,
              limit,
            }
          }
          
          async one${UCFSingular}(obj: any | null, args: QueryOne${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<API${UCFSingular}> {
            const { id } = args
            const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
            await this.apply${UCFSingular}Filters(qry, { id })
            const ${LCFSingular} = await qry.getOne()
            if (!${LCFSingular}) {
              throw new Error(\`${UCFSingular} not found\`)
            }
            return ${LCFSingular} as unknown as API${UCFSingular}
          }
          
          async count${UCFPlural}(obj: any | null, args: QueryCount${UCFPlural}Args = {}, ctx: GQLContext, info: GraphQLResolveInfo): Promise<number> {
            const { filters = {} } = args
            const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
            await this.apply${UCFSingular}Filters(qry, filters)
            const ${LCFPlural} = await qry.getCount()
            return ${LCFPlural}
          }
          
          async check${UCFSingular}Exists(id: ID): Promise<boolean> {
            const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
            const count${UCFPlural} = await qry.where(\`"id" = :id\`, { id }).getCount()
            if (count${UCFPlural} === 0) {
              return false
            }
            return true
          }
          
          async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {
            
          }
          
          async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          
          }
          
        }

        export default ${UCFSingular}ResolversGenerated

      `)

      return this.writeToFile(code.toString(), filePath)
    }

    code.addBlock(`
      import { SelectQueryBuilder } from 'typeorm'
      import { GraphQLResolveInfo } from 'graphql'
      import { AppDataSource } from '@root/data-source'
      
      class ${UCFSingular}ResolversGenerated {
        
      }

      export default ${UCFSingular}ResolversGenerated

    `)

    return this.writeToFile(code.toString(), filePath)
  }

  async buildGeneratedResoler(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    code.addBlock(`
      import { GQLRegistry } from 'gql-registry'
      import { PermissionRegistry } from '@lib/PermissionRegistry'
      import ${UCFSingular}Resolvers from '@GQLtypes/${UCFSingular}/${UCFSingular}Resolvers'
      
      const registry: GQLRegistry = GQLRegistry.shared()
      const permissionRegistry: PermissionRegistry = PermissionRegistry.shared()
      const ${LCFSingular}Resolvers = new ${UCFSingular}Resolvers()
      ${LCFSingular}Resolvers.register(registry, permissionRegistry)

    `)

    return this.writeToFile(code.toString(), filePath)
  }

  async buildGeneratedSchema(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    code.addBlock(`
      import { GQLRegistry } from 'gql-registry'
      import ${UCFSingular}Schema from '@GQLtypes/${UCFSingular}/${UCFSingular}Schema'

      const registry: GQLRegistry = GQLRegistry.shared()
      const ${LCFSingular}Schema = new ${UCFSingular}Schema()
      ${LCFSingular}Schema.register(registry)
    `)

    return this.writeToFile(code.toString(), filePath)
  }

}

export default InterfaceBuilder
