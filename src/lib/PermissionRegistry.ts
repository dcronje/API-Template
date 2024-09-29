import { APIRegistry } from '@simple/api-registry'
import * as changeCase from 'change-case'
import { DocumentNode, ObjectTypeDefinitionNode } from 'graphql'
import chalk from 'chalk'
import { AppDataSource } from '@root/data-source'
import { DataSource } from 'typeorm'
import { Permission, Role } from '@models/index'

export interface PermissionInputType {
  name: string
  description: string
  isOwned: boolean
}

export interface RegsiteredPermission extends PermissionInputType {
  id?: string
  identifier: string
}

type ResolveFunction = (user: any, withData: any, forObject: string, andProperty: string | null, connection?: DataSource) => Promise<boolean>

export interface ResolverFunctions {
  [k: string]: ResolveFunction
}

export class PermissionRegistry {

  static instance: PermissionRegistry | null = null
  permissions: RegsiteredPermission[] = []
  resolverFunctions: ResolverFunctions = {}

  static shared(): PermissionRegistry {
    if (!this.instance) {
      this.instance = new PermissionRegistry()
    }
    return this.instance
  }

  async startup(apiRegistry: APIRegistry): Promise<void> {
    await this.syncPermissions()
    await this.validatePermissions(apiRegistry)
    await this.createDefaultUserRole()
  }

  async validatePermissions(apiRegistry: APIRegistry): Promise<void> {
    const schema = await apiRegistry.getDefinitionsDocument() as DocumentNode
    const permissions: string[] = []
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    schema.definitions.forEach((definition: ObjectTypeDefinitionNode) => {
      if (definition.fields) {
        definition.fields.forEach((field) => {
          if (field.directives) {
            field.directives.forEach((directive) => {
              if (directive.name.value === 'Permissions' && directive.arguments) {
                directive.arguments.forEach((arg) => {
                  if (arg.value.kind === 'ListValue') {
                    arg.value.values.forEach((val) => {
                      if (val.kind === 'StringValue') {
                        if (permissions.indexOf(val.value) === -1) {
                          permissions.push(val.value)
                        }
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
    for (let p = 0; p < permissions.length; p++) {
      const dbPermission = await AppDataSource.getRepository(Permission).createQueryBuilder().where('"identifier" = :identifier', { identifier: permissions[p] }).getOne()
      if (!dbPermission) {
        console.warn(chalk.red(`Warning! Missing Permission with identifier: ${permissions[p]}`))
      }
    }
  }

  async checkPermissionExists(permission: RegsiteredPermission): Promise<boolean> {
    const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    qry.where('"identifier" = :identifier', { identifier: permission.identifier })
    const exists = await qry.getCount()
    if (exists === 0) {
      return false
    }
    return true
  }

  async registerPermissions(permissions: PermissionInputType[]): Promise<void> {
    const newPermissions: RegsiteredPermission[] = permissions.map((permission) => {
      return {
        ...permission,
        identifier: changeCase.constantCase(permission.name),
      }
    })
    newPermissions.forEach((permission) => {
      if (!this.permissions.map((perm) => perm.identifier).includes(permission.identifier)) {
        this.permissions.push(permission)
      }
    })
  }

  async syncPermissions(): Promise<void> {
    let qry = AppDataSource.getRepository(Permission).createQueryBuilder()
    await qry.where('1 = 1').update().set({ isDeprecated: true }).execute()

    for (const p in this.permissions) {
      const exists = await this.checkPermissionExists(this.permissions[p])
      if (!exists) {
        const insertQry = AppDataSource.getRepository(Permission).createQueryBuilder()
        await insertQry.insert().values([this.permissions[p]]).execute()
      } else {
        const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
        await qry.where('"identifier" = :identifier', { identifier: this.permissions[p].identifier }).update().set({ isDeprecated: false }).execute()
      }
    }
  }

  async createDefaultUserRole(): Promise<void> {
    let defaultRole = await AppDataSource.getRepository(Role).createQueryBuilder()
      .where('"isDefaultForRegisteredUser" = TRUE')
      .getOne()
    if (!defaultRole) {
      defaultRole = Role.create({
        name: 'Regsitered User',
        description: 'Default Role For Registered User',
        isDefaultForRegisteredUser: true,
      })
      await defaultRole.save()
      const permissions = await AppDataSource.getRepository(Permission).createQueryBuilder().where('"identifier" IN (:...identifiers)', { identifiers: ['USER_READ_OWNED', 'USER_WRITE_OWNED'] }).getMany()
      defaultRole.permissions = permissions
      await defaultRole.save()
    }
    // let userIdsQry = `SELECT "id" FROM "user" WHERE "type" = 'RegisteredUser' AND "id" NOT IN (SELECT "userId" FROM "user_role" WHERE "roleId" = $1)`
    const userIdsQry = 'SELECT "id" FROM "user" WHERE "id" NOT IN (SELECT "userId" FROM "user_role" WHERE "roleId" = $1)'
    const userIds = await AppDataSource.query(userIdsQry, [defaultRole.id])
    if (userIds.length) {
      const valueItems: string[] = []
      const values: string[] = [defaultRole.id]
      for (let u = 0; u < userIds.length; u++) {
        valueItems.push(`($${u + 2}, $1)`)
        values.push(userIds[u].id)
      }
      const qry = `INSERT INTO "user_role" ("userId", "roleId") VALUES ${valueItems.join(', ')}`
      await AppDataSource.query(qry, values)
    }

  }

  async resolve(permission: string, user: any, withData: any, forObject: string, andProperty: string | null): Promise<boolean> {
    if (this.resolverFunctions[permission]) {
      return this.resolverFunctions[permission](user, withData, forObject, andProperty)
    }
    return false
  }

  registerResolver(permission: string, resolverFunction: ResolveFunction): void {
    this.resolverFunctions[permission] = resolverFunction
  }

}


