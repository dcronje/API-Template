import { GraphQLResolveInfo } from 'graphql'
import { APIRegistry } from '@simple/api-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { SelectQueryBuilder } from 'typeorm'
import RoleResolversGenerated from '@generated/Role/RoleResolversGenerated'
import * as changeCase from 'change-case'
import { AppDataSource } from '@root/data-source'
import { MutationAddRoleArgs, MutationUpdateRoleArgs, MutationAssignPermissionArgs, MutationUnassignPermissionArgs, RoleFilters, RoleOrder, Role as APIRole } from '@root/types/generated'
import { Utilities } from '@lib/Utilities'
import { Role } from '@models/index'

class RoleResolvers extends RoleResolversGenerated {

  register(registry: APIRegistry, permissionRegistry: PermissionRegistry): void {
    const queryResolvers = {
      allRoles: this.allRoles,
      oneRole: this.oneRole,
      countRoles: this.countRoles,
    }
    const mutationResolvers = {
      addRole: this.addRole,
      updateRole: this.updateRole,
      removeRole: this.removeRole,
      assignPermission: this.assignPermission,
      unassignPermission: this.unassignPermission,
    }
    registry.registerType({
      queryResolvers,
      mutationResolvers,
    })
  }

  async addRole(obj: unknown, args: MutationAddRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIRole> {
    let permissionIds: string[] | undefined = undefined
    if (args.input.permissions) {
      permissionIds = args.input.permissions as string[]
      delete args.input.permissions
    }
    const role = await super.addRole(obj, args, ctx, info)
    if (permissionIds) {
      for (let p = 0; p < permissionIds.length; p++) {
        await AppDataSource.query(`INSERT INTO "permission_roles" ("roleId", "permissionId") VALUES ($1, $2)`, [role.id, permissionIds[p]])
      }
    }
    return role as unknown as APIRole
  }

  async updateRole(obj: unknown, args: MutationUpdateRoleArgs, ctx: GQLContext, info: GraphQLResolveInfo): Promise<APIRole> {
    let newPermissionIds: string[] | undefined = undefined
    if (args.input.permissions) {
      newPermissionIds = args.input.permissions as string[]
      delete args.input.permissions
    }
    const role = await super.updateRole(obj, args, ctx, info) as unknown as Role
    if (newPermissionIds) {
      const currentPermssions = await role.permissions
      const oldPermissioIds = currentPermssions?.map((perm) => perm.id)
      const { add, remove, update } = Utilities.diffArrays<string>(oldPermissioIds, newPermissionIds)
      for (let a = 0; a < add.length; a++) {
        await AppDataSource.query(`INSERT INTO "permission_roles" ("roleId", "permissionId") VALUES ($1, $2)`, [role.id, add[a]])
      }
      for (let r = 0; r < remove.length; r++) {
        await AppDataSource.query(`DELETE FROM "permission_roles" WHERE "roleId" = $1, "permissionId" = $2`, [role.id, remove[r]])
      }
      for (let u = 0; u < update.length; u++) {
        await AppDataSource.query(`UPDATE "permission_roles" SET "updatedAt" = NOW() WHERE "roleId" = $1, "permissionId" = $2`, [role.id, update[u]])
      }
    }
    return role as unknown as APIRole
  }

  async assignPermission(obj: unknown, args: MutationAssignPermissionArgs): Promise<boolean> {
    const { id, permissionId } = args
    await AppDataSource.query('INSERT INTO permission_roles("roleId", "permissionId") VALUES ($1, $2)', [id, permissionId])
    return true
  }

  async unassignPermission(_: unknown, args: MutationUnassignPermissionArgs): Promise<boolean> {
    const { id, permissionId } = args
    await AppDataSource.query('DELETE FROM permission_roles WHERE "roleId" = $1 AND "permissionId" = $2', [id, permissionId])
    return true
  }

  async applyRoleFilters(qry: SelectQueryBuilder<Role>, filters: RoleFilters): Promise<void> {
    if (filters.minCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" >= :minCreatedAt`, { minCreatedAt: filters.minCreatedAt })
    }
    if (filters.maxCreatedAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" <= :maxCreatedAt`, { maxCreatedAt: filters.maxCreatedAt })
    }
    if (filters.minUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" >= :minUpdatedAt`, { minUpdatedAt: filters.minUpdatedAt })
    }
    if (filters.maxUpdatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" <= :maxUpdatedAt`, { maxUpdatedAt: filters.maxUpdatedAt })
    }
    if (filters.createdAt) {
      qry.andWhere(`"${qry.alias}"."createdAt" = :createdAt`, { createdAt: filters.createdAt })
    }
    if (filters.updatedAt) {
      qry.andWhere(`"${qry.alias}"."updatedAt" = :updatedAt`, { updatedAt: filters.updatedAt })
    }
    if (filters.id) {
      qry.andWhere(`"${qry.alias}"."id" = :id`, { id: filters.id })
    }
    if (filters.ids) {
      qry.whereInIds(filters.ids)
    }
    if (filters.search) {
      qry.andWhere(`"${qry.alias}".LOWER("name") LIKE LOWER(:name)`, { name: `%${filters.search}%` })
    }

  }

  async applyRoleOrder(qry: SelectQueryBuilder<Role>, order: Array<RoleOrder>): Promise<void> {
    order.forEach((orderItem: RoleOrder) => {
      const orderByField = changeCase.camelCase(orderItem.field as string)
      qry.addOrderBy(`"${qry.alias}"."${orderByField}"`, orderItem.direction)
    })
  }

}

export default RoleResolvers
