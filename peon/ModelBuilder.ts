import path from 'path'
import { FileSchema } from './type.d'
import Builder from './Builder'
import CodeGen from './CodeGen'
import { PathLike } from 'fs'

class ModelBuilder extends Builder {

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
    const { UCFSingular } = schemaItem.names
    const code = new CodeGen()

    const interfaceName = schemaItem.implements.length ? schemaItem.implements[0] : ''

    if (interfaceName) {
      code.addBlock(`
        import { Column, ChildEntity } from 'typeorm'
        import { ${interfaceName} } from './${interfaceName}'
        @ChildEntity()
        export class ${UCFSingular} extends ${interfaceName} {
  
        }
      `)
    } else {
      code.addBlock(`
        import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm'
        import moment from 'moment'
  
        @Entity()
        export class ${UCFSingular} extends BaseEntity {
  
          @PrimaryGeneratedColumn('uuid')
          id!: string
        
          @Column({ type: 'varchar' })
          name!: string
        
          @Column({ type: 'text' })
          description!: string
        
          @CreateDateColumn({ type: 'timestamptz' })
          createdAt: Date = new Date()
        
          @UpdateDateColumn({ type: 'timestamptz' })
          updatedAt: Date = new Date()
        }
      `)
    }

    return this.writeToFile(code.toString(), filePath)
  }

  async buildSchema(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural } = schemaItem.names
    const code = new CodeGen()

    const interfaceName = schemaItem.implements.length ? schemaItem.implements[0] : ''

    if (!schemaItem.hasStorage) {
      code.addBlock(`
        import { APIRegistry } from '@simple/api-registry'
        import gql from 'graphql-tag'

        class ${UCFSingular}Schema {

          register(registry: APIRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
            })
          }
  
          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            type ${UCFSingular} ${interfaceName !== '' ? `implements ${interfaceName} ` : ''}{
              name: String!
              """The creation date of the ${UCFSingular}"""
              createdAt: DateTime
              """The update date of the ${UCFSingular}"""
              updatedAt: DateTime
            }
          
            """Fields to add a new ${UCFSingular}"""
            input ${UCFSingular}Input {
              name: String!
              description: String
            }
  
          \`

        }

        export default ${UCFSingular}Schema
      `)
    } else {
      code.addLine('import { APIRegistry } from \'@simple/api-registry\'')
      code.addLine('import gql from \'graphql-tag\'')
      code.addLine('')
      code.addLine(`class ${UCFSingular}Schema {`)
      code.addInsetLine('')

      if (schemaItem.requiresQueries && schemaItem.requiresMutations) {
        code.addBlock(`
          register(registry: APIRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
              queryDefinitions: this.queryDefinitions,
              mutationDefinitions: this.mutationDefinitions,
            })
          }

          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            type ${UCFSingular} ${interfaceName !== '' ? `implements ${interfaceName} ` : ''}{
              """The ${UCFSingular}'s ID"""
              id: ID!
              name: String!
              """The creation date of the ${UCFSingular}"""
              createdAt: DateTime
              """The update date of the ${UCFSingular}"""
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
          
            """Fields to add a new ${UCFSingular}"""
            input Add${UCFSingular}Input {
              name: String!
              description: String
            }
          
            """Fields to update an existing ${UCFSingular}"""
            input Update${UCFSingular}Input {
              name: String
              description: String
            }

          \`

          queryDefinitions = gql\`
            type Query {
              """Get a list of ${UCFSingular} with order and filtering options"""
              all${UCFPlural}(skip: Int, limit: Int, filters: ${UCFSingular}Filters, order: [${UCFSingular}Order]): ${UCFSingular}List!
            
              """Get a specific ${UCFSingular} by ID"""
              one${UCFSingular}(id: ID!): ${UCFSingular}!
            
              """Get a count of ${UCFSingular} with filtering options"""
              count${UCFPlural}(filters: ${UCFSingular}Filters): Int!
            }
          
          \`
          
          mutationDefinitions = gql\`
            type Mutation {
              """Add a new ${UCFSingular}"""
              add${UCFSingular}(input: Add${UCFSingular}Input!): ${UCFSingular}!
            
              """Update an existing ${UCFSingular}"""
              update${UCFSingular}(id: ID!, input: Update${UCFSingular}Input!): ${UCFSingular}!
            
              """Delete a ${UCFSingular}"""
              remove${UCFSingular}(id: ID!): ID!
            }
            
          \`

        `)
      } else if (schemaItem.requiresQueries) {
        code.addBlock(`
          register(registry: APIRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
              queryDefinitions: this.queryDefinitions,
            })
          }

          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            type ${UCFSingular} ${interfaceName !== '' ? `implements ${interfaceName} ` : ''}{
              """The ${UCFSingular}'s ID"""
              id: ID!
              name: String!
              """The creation date of the ${UCFSingular}"""
              createdAt: DateTime
              """The update date of the ${UCFSingular}"""
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
              """Get a list of ${UCFSingular} with order and filtering options"""
              all${UCFPlural}(skip: Int, limit: Int, filters: ${UCFSingular}Filters, order: [${UCFSingular}Order]): ${UCFSingular}List!
            
              """Get a specific ${UCFSingular} by ID"""
              one${UCFSingular}(id: ID!): ${UCFSingular}!
            
              """Get a count of ${UCFSingular} with filtering options"""
              count${UCFPlural}(filters: ${UCFSingular}Filters): Int!
            }
          
          \`

        `)
      } else if (schemaItem.requiresMutations) {
        code.addBlock(`
          register(registry: APIRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
              mutationDefinitions: this.mutationDefinitions,
            })
          }

          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            type ${UCFSingular} ${interfaceName !== '' ? `implements ${interfaceName} ` : ''}{
              """The ${UCFSingular}'s ID"""
              id: ID!
              name: String!
              """The creation date of the ${UCFSingular}"""
              createdAt: DateTime
              """The update date of the ${UCFSingular}"""
              updatedAt: DateTime
            }
          
            """Fields to add a new ${UCFSingular}"""
            input Add${UCFSingular}Input {
              name: String!
              description: String
            }
          
            """Fields to update an existing ${UCFSingular}"""
            input Update${UCFSingular}Input {
              name: String
              description: String
            }

          \`
          
          mutationDefinitions = gql\`
            type Mutation {
              """Add a new ${UCFSingular}"""
              add${UCFSingular}(input: Add${UCFSingular}Input!): ${UCFSingular}!
            
              """Update an existing ${UCFSingular}"""
              update${UCFSingular}(id: ID!, input: Update${UCFSingular}Input!): ${UCFSingular}!
            
              """Delete a ${UCFSingular}"""
              remove${UCFSingular}(id: ID!): ID!
            }
            
          \`

        `)
      } else {
        code.addBlock(`
          register(registry: APIRegistry): void {
            registry.registerType({
              typeDefinitions: this.typeDefinitions,
            })
          }

          typeDefinitions = gql\`
            """Represents a ${UCFSingular} in the system"""
            type ${UCFSingular} ${interfaceName !== '' ? `implements ${interfaceName} ` : ''}{
              """The ${UCFSingular}'s ID"""
              id: ID!
              name: String!
              """The creation date of the ${UCFSingular}"""
              createdAt: DateTime
              """The update date of the ${UCFSingular}"""
              updatedAt: DateTime
            }

          \`

        `)
      }

      code.addLine('')
      code.addOutsetLine('}')
      code.addLine('')
      code.addLine(`export default ${UCFSingular}Schema`)
      code.addLine('')
    }

    return this.writeToFile(code.toString(), filePath)
  }

  async buildResoler(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural } = schemaItem.names
    const code = new CodeGen()

    if (!schemaItem.hasStorage) {
      return
    }

    code.addBlock(`
      import { APIRegistry } from '@simple/api-registry'
      import { PermissionRegistry } from '@lib/PermissionRegistry'
      import { SelectQueryBuilder } from 'typeorm'
      import { ${UCFSingular} } from '@models/index'
      import { camelCase } from 'change-case'
      import ${UCFSingular}ResolversGenerated from '@generated/${UCFSingular}/${UCFSingular}ResolversGenerated'
      import { ${UCFSingular}Filters, ${UCFSingular}Order } from '@root/types/generated'
    `)
    code.addLine('')
    code.addLine(`class ${UCFSingular}Resolvers extends ${UCFSingular}ResolversGenerated {`)
    code.addInsetLine('')

    if (schemaItem.requiresQueries && schemaItem.requiresMutations) {
      code.addBlock(`
        register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
          const queryResolvers = {
            all${UCFPlural}: this.all${UCFPlural},
            one${UCFSingular}: this.one${UCFSingular},
            count${UCFPlural}: this.count${UCFPlural},
          }
          const mutationResolvers = {
            add${UCFSingular}: this.add${UCFSingular},
            update${UCFSingular}: this.update${UCFSingular},
            remove${UCFSingular}: this.remove${UCFSingular},
          }
          registry.registerType({
            queryResolvers,
            mutationResolvers,
          })
        }
      
        static async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {

          if (filters.id) {
            qry.andWhere(\`"\${qry.alias}"."id" = :id\`, { id: filters.id })
          }
      
          if (filters.ids) {
            qry.andWhereInIds(filters.ids)
          }

          if (filters.minCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" >= :minCreatedAt\`, { minCreatedAt: filters.minCreatedAt })
          }
      
          if (filters.minCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" >= :minCreatedAt\`, { minCreatedAt: filters.minCreatedAt })
          }
      
          if (filters.maxCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" <= :maxCreatedAt\`, { maxCreatedAt: filters.maxCreatedAt })
          }
      
          if (filters.createdAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" = :createdAt\`, { createdAt: filters.createdAt })
          }
      
          if (filters.minUpdatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" >= :minUpdatedAt\`, { minUpdatedAt: filters.minUpdatedAt })
          }
      
          if (filters.maxUpdatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" <= :maxUpdatedAt\`, { maxUpdatedAt: filters.maxUpdatedAt })
          }
      
          if (filters.updatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" = :updatedAt\`, { updatedAt: filters.updatedAt })
          }

          return
        }
      
        static async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          order.forEach((orderItem: ${UCFSingular}Order) => {
            const orderByField = camelCase(orderItem.field as string);
            qry.addOrderBy(\`"\${qry.alias}"."\${orderByField}"\`, orderItem.direction || 'DESC')
          })
        }

        async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {
          return ${UCFSingular}Resolvers.apply${UCFSingular}Filters(qry, filters)
        }

        async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          await ${UCFSingular}Resolvers.apply${UCFSingular}Order(qry, order)
        }
      `)
    } else if (schemaItem.requiresQueries) {
      code.addBlock(`
        register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
          const queryResolvers = {
            all${UCFPlural}: this.all${UCFPlural},
            one${UCFSingular}: this.one${UCFSingular},
            count${UCFPlural}: this.count${UCFPlural},
          }
          registry.registerType({
            queryResolvers,
          })
        }
      
        static async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {

          if (filters.id) {
            qry.andWhere(\`"\${qry.alias}"."id" = :id\`, { id: filters.id })
          }
      
          if (filters.ids) {
            qry.andWhereInIds(filters.ids)
          }

          if (filters.minCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" >= :minCreatedAt\`, { minCreatedAt: filters.minCreatedAt })
          }
      
          if (filters.minCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" >= :minCreatedAt\`, { minCreatedAt: filters.minCreatedAt })
          }
      
          if (filters.maxCreatedAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" <= :maxCreatedAt\`, { maxCreatedAt: filters.maxCreatedAt })
          }
      
          if (filters.createdAt) {
            qry.andWhere(\`"\${qry.alias}"."createdAt" = :createdAt\`, { createdAt: filters.createdAt })
          }
      
          if (filters.minUpdatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" >= :minUpdatedAt\`, { minUpdatedAt: filters.minUpdatedAt })
          }
      
          if (filters.maxUpdatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" <= :maxUpdatedAt\`, { maxUpdatedAt: filters.maxUpdatedAt })
          }
      
          if (filters.updatedAt) {
            qry.andWhere(\`"\${qry.alias}"."updatedAt" = :updatedAt\`, { updatedAt: filters.updatedAt })
          }
          
          return
        }
      
        static async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          order.forEach((orderItem: ${UCFSingular}Order) => {
            const orderByField = camelCase(orderItem.field as string);
            qry.addOrderBy(\`"\${qry.alias}"."\${orderByField}"\`, orderItem.direction || 'DESC')
          })
        }

        async apply${UCFSingular}Filters(qry: SelectQueryBuilder<${UCFSingular}>, filters: ${UCFSingular}Filters): Promise<void> {
          return ${UCFSingular}Resolvers.apply${UCFSingular}Filters(qry, filters)
        }

        async apply${UCFSingular}Order(qry: SelectQueryBuilder<${UCFSingular}>, order: Array<${UCFSingular}Order>): Promise<void> {
          await ${UCFSingular}Resolvers.apply${UCFSingular}Order(qry, order)
        }
      `)
    } else if (schemaItem.requiresMutations) {
      code.addBlock(`
        register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
          const mutationResolvers = {
            add${UCFSingular}: this.add${UCFSingular},
            update${UCFSingular}: this.update${UCFSingular},
            remove${UCFSingular}: this.remove${UCFSingular},
          }
          registry.registerType({
            mutationResolvers,
          })
        }
      `)
    } else {
      code.addLine('register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {}')
    }

    code.addLine('')
    code.addOutsetLine('}')
    code.addLine('')
    code.addLine(`export default ${UCFSingular}Resolvers`)
    code.addLine('')

    return this.writeToFile(code.toString(), filePath)
  }

  async buildGeneratedClass(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, UCFPlural, LCFPlural, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    if (!schemaItem.hasStorage) {
      return
    }

    let typeImports = ''
    if (schemaItem.requiresQueries && schemaItem.requiresMutations) {
      typeImports = `import { ${UCFSingular}List, QueryAll${UCFPlural}Args, QueryOne${UCFSingular}Args, QueryCount${UCFPlural}Args, MutationAdd${UCFSingular}Args, MutationUpdate${UCFSingular}Args, MutationRemove${UCFSingular}Args, ${UCFSingular}Filters, ${UCFSingular}Order, ${UCFSingular} as API${UCFSingular} } from '@root/types/generated'`
    } else if (schemaItem.requiresMutations) {
      typeImports = `import { MutationAdd${UCFSingular}Args, MutationUpdate${UCFSingular}Args, MutationRemove${UCFSingular}Args, ${UCFSingular} as API${UCFSingular} } from '@root/types/generated'`
    } else if (schemaItem.requiresQueries) {
      typeImports = `import { ${UCFSingular}List, QueryAll${UCFPlural}Args, QueryOne${UCFSingular}Args, QueryCount${UCFPlural}Args, ${UCFSingular}Filters, ${UCFSingular}Order, ${UCFSingular} as API${UCFSingular} } from '@root/types/generated'`
    }

    code.addBlock(`
      import { GraphQLError, GraphQLResolveInfo } from 'graphql'
      import { SelectQueryBuilder } from 'typeorm'
      import { AppDataSource } from '@root/data-source'
      import { ReadStream } from 'typeorm/platform/PlatformTools'
      import { ${UCFSingular} } from '@models/index'
      import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
      import { clearCacheKeys } from '@lib/CachePlugin'
      ${typeImports}
    `)
    code.addLine(`class ${UCFSingular}ResolversGenerated {`)
    code.addInsetLine('')
    if (schemaItem.requiresQueries && schemaItem.requiresMutations) {
      code.addBlock(`
        constructor() {
          this.all${UCFPlural} = this.all${UCFPlural}.bind(this)
          this.one${UCFSingular} = this.one${UCFSingular}.bind(this)
          this.count${UCFPlural} = this.count${UCFPlural}.bind(this)
          this.add${UCFSingular} = this.add${UCFSingular}.bind(this)
          this.update${UCFSingular} = this.update${UCFSingular}.bind(this)
          this.remove${UCFSingular} = this.remove${UCFSingular}.bind(this)
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
              yield ${UCFSingular}.create(chunk) as unknown as API${UCFSingular}
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
            throw new GraphQLError(\`${UCFSingular} not found\`, { extensions: { code: '404' } })
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
      `)
      code.addLine('')
      code.addLine(`async add${UCFSingular}(obj: any | null, args: MutationAdd${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<API${UCFSingular}> {`)
      code.inset()
      code.addLine('const { input } = args')
      code.addBlock(`
        const ${LCFSingular} = ${UCFSingular}.create(input as any)
        await ${LCFSingular}.save()
        clearCacheKeys([{ type: '${UCFSingular}' }])
      `)
      code.addLine(`return ${LCFSingular} as unknown as API${UCFSingular}`)
      code.addOutsetLine('}')
      code.addLine('')
      code.addLine(`async update${UCFSingular}(obj: any | null, args: MutationUpdate${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<API${UCFSingular}> {`)
      code.inset()
      code.addLine('const { id, input } = args')
      code.addBlock(`
        let exists = await this.check${UCFSingular}Exists(id)
        if (!exists) {
          throw new GraphQLError(\`${UCFSingular} Model not found\`, { extensions: { code: '404' } })
        }
        const updateQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
        await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<${UCFSingular}>).where(\`"id" = :id\`, { id }).execute()
        const getQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
        const ${LCFSingular} = await getQry.where(\`"id" = :id\`, { id }).getOne()
        clearCacheKeys([{ type: '${UCFSingular}', id: ${LCFSingular}?.id }])
      `)
      code.addLine(`return ${LCFSingular} as unknown as API${UCFSingular}`)
      code.addOutsetLine('}')
      code.addLine('')
      code.addLine(`async remove${UCFSingular}(obj: any | null, args: MutationRemove${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {`)
      code.inset()
      code.addLine('const { id } = args')
      code.addBlock(`
        const ${LCFSingular} = await AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
          .where('"id" = :id', { id })
          .getOne()
        if (!${LCFSingular}) {
          throw new GraphQLError('${UCFSingular} not found', { extensions: { code: '404' } })
        }
        await ${LCFSingular}.remove()
        clearCacheKeys([{ type: '${UCFSingular}', id }])
        return id
      `)
      code.addOutsetLine('}')
      code.addLine('')
      code.addBlock(`
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
      `)
    } else if (schemaItem.requiresQueries) {
      code.addBlock(`
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
              yield ${UCFSingular}.create(chunk)
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
            throw new GraphQLError(\`${UCFSingular} not found\`, { extensions: { code: '404' } })
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
      `)
    } else if (schemaItem.requiresMutations) {
      code.addBlock(`
        constructor() {
          this.add${UCFSingular} = this.add${UCFSingular}.bind(this)
          this.update${UCFSingular} = this.update${UCFSingular}.bind(this)
          this.remove${UCFSingular} = this.remove${UCFSingular}.bind(this)
        }
      `)
      code.addLine('')
      code.addLine(`async add${UCFSingular}(obj: any | null, args: MutationAdd${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<API${UCFSingular}> {`)
      code.inset()
      code.addLine('const { input } = args')

      code.addBlock(`
        const ${LCFSingular} = ${UCFSingular}.create(input as any)
        await ${LCFSingular}.save()
        clearCacheKeys([{ type: '${UCFSingular}' }])
      `)
      code.addLine(`return ${LCFSingular} as unknown as API${UCFSingular}`)
      code.addOutsetLine('}')
      code.addLine('')
      code.addLine(`async update${UCFSingular}(obj: any | null, args: MutationUpdate${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<API${UCFSingular}> {`)
      code.inset()
      code.addLine('const { id, input } = args')
      code.addBlock(`
        let exists = await this.check${UCFSingular}Exists(id)
        if (!exists) {
          throw new GraphQLError(\`${UCFSingular} Model not found\`, { extensions: { code: '404' } })
        }
        const updateQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
        await updateQry.update().set({ ...input, id } as unknown as QueryDeepPartialEntity<${UCFSingular}>).where(\`"id" = :id\`, { id }).execute()
        const getQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
        const ${LCFSingular} = await getQry.where(\`"id" = :id\`, { id }).getOne()
        clearCacheKeys([{ type: '${UCFSingular}', id: ${LCFSingular}?.id }])
      `)
      code.addLine(`return ${LCFSingular} as unknown as API${UCFSingular}`)
      code.addOutsetLine('}')
      code.addLine('')

      code.addLine(`async remove${UCFSingular}(obj: any | null, args: MutationRemove${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<string> {`)
      code.inset()
      code.addLine('const { id } = args')
      code.addBlock(`
        const ${LCFSingular} = await AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
          .where('"id" = :id', { id })
          .getOne()
        if (!${LCFSingular}) {
          throw new GraphQLError('${UCFSingular} not found', { extensions: { code: '404' } })
        }
        await ${LCFSingular}.remove()
        clearCacheKeys([{ type: '${UCFSingular}', id }])
        return id
      `)
      code.addOutsetLine('}')
      code.addLine('')
      code.addBlock(`
        async check${UCFSingular}Exists(id: ID): Promise<boolean> {
          const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
          const count${UCFPlural} = await qry.where(\`"id" = :id\`, { id }).getCount()
          if (count${UCFPlural} === 0) {
            return false
          }
          return true
        }
      `)

      //   code.addBlock(`
      //     async add${UCFSingular}(obj: any | null, args: MutationAdd${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<GQL${UCFSingular}> {
      //       const { input } = args
      //       const insertQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       const response = await insertQry.insert().values([input as QueryDeepPartialEntity<${UCFSingular}>]).execute()
      //       const insertedId = response.identifiers[0].id
      //       const getQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       const ${LCFSingular} = await getQry.where({ id: insertedId }).getOne()
      //       return ${LCFSingular}! as unknown as GQL${UCFSingular}
      //     }

      //     async update${UCFSingular}(obj: any | null, args: MutationUpdate${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<GQL${UCFSingular}> {
      //       const { id, input } = args
      //       let exists = await this.check${UCFSingular}Exists(id)
      //       if (!exists) {
      //         throw new GraphQLError(\`${UCFSingular} Model not found\`, { extensions: { code: '404' } })
      //       }
      //       const updateQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       await updateQry.update().set({ ...input } as QueryDeepPartialEntity<${UCFSingular}>).where(\`"id" = :id\`, { id }).execute()
      //       const getQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       const ${LCFSingular} = await getQry.where(\`"id" = :id\`, { id }).getOne()
      //       return ${LCFSingular}! as unknown as GQL${UCFSingular}
      //     }

      //     async remove${UCFSingular}(obj: any | null, args: MutationRemove${UCFSingular}Args, ctx: GQLContext, info: GraphQLResolveInfo): Promise<ID> {
      //       const { id } = args
      //       let exists = await this.check${UCFSingular}Exists(id)
      //       if (!exists) {
      //         throw new GraphQLError(\`${UCFSingular} Model not found\`, { extensions: { code: '404' } })
      //       }
      //       const removeQry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       await removeQry.delete().where(\`"id" = :id\`, { id }).execute()
      //       return id
      //     }

      //     async check${UCFSingular}Exists(id: ID): Promise<boolean> {
      //       const qry = AppDataSource.getRepository(${UCFSingular}).createQueryBuilder()
      //       const count${UCFPlural} = await qry.where(\`"id" = :id\`, { id }).getCount()
      //       if (count${UCFPlural} === 0) {
      //         return false
      //       }
      //       return true
      //     }
      //   `)
    }
    code.addLine('')
    code.addOutsetLine('}')
    code.addLine('')
    code.addLine(`export default ${UCFSingular}ResolversGenerated`)
    code.addLine('')

    return this.writeToFile(code.toString(), filePath)
  }

  async buildGeneratedResoler(schemaItem: FileSchema, filePath: PathLike): Promise<void> {
    const { UCFSingular, LCFSingular } = schemaItem.names
    const code = new CodeGen()

    if (!schemaItem.hasStorage) {
      return
    }

    code.addBlock(`
      import { APIRegistry } from '@simple/api-registry'
      import { PermissionRegistry } from '@lib/PermissionRegistry'
      import ${UCFSingular}Resolvers from '@GQLtypes/${UCFSingular}/${UCFSingular}Resolvers'
      
      const registry: APIRegistry = APIRegistry.shared()
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
      import { APIRegistry } from '@simple/api-registry'
      import ${UCFSingular}Schema from '@GQLtypes/${UCFSingular}/${UCFSingular}Schema'

      const registry: APIRegistry = APIRegistry.shared()
      const ${LCFSingular}Schema = new ${UCFSingular}Schema()
      ${LCFSingular}Schema.register(registry)
    `)

    return this.writeToFile(code.toString(), filePath)
  }

}

export default ModelBuilder
