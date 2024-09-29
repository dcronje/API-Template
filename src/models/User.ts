import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, TableInheritance, Index, Brackets } from 'typeorm'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import { GraphQLError } from 'graphql'
import { AppDataSource } from '@root/data-source'
import bcrypt from 'bcryptjs'
import { TitleEnum } from '@root/types/generated'
import { Device, Permission, UserDevice, UserRole } from '@models/index'

@Entity()
export class User extends BaseEntity {

  permissionCache: { [k: string]: boolean } = {}
  permissionIds?: string[]

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', nullable: true })
  title!: TitleEnum | null

  @Index()
  @Column({ type: 'varchar', default: 'GUEST' })
  firstName!: string

  @Index()
  @Column({ type: 'varchar', default: 'GUEST' })
  lastName!: string

  @Column({ type: 'varchar', unique: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  verifiedEmail!: string | null

  @Column({ type: 'text', nullable: true })
  password: string | null = null

  @Column({ type: 'boolean', default: false })
  isInvited!: boolean

  @Column({ type: 'boolean', default: false })
  hasAcceptedInvite!: boolean

  @Column({ type: 'varchar', nullable: true })
  invitationToken: string | null = null

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null = null

  @OneToMany(() => UserDevice, userDevice => userDevice.user, { lazy: true })
  userDevices!: Promise<Array<UserDevice>> | Array<UserDevice>

  @OneToMany(() => UserRole, userRole => userRole.user, { lazy: true })
  userRoles!: Promise<Array<UserRole>> | Array<UserRole>

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

  name(): string {
    return `${this.firstName} ${this.lastName}`
  }

  emailIsVerified(): boolean {
    return this.email !== '' && this.email === this.verifiedEmail
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return false
    }
    try {
      const isValidPassword = await bcrypt.compare(password, this.password)
      if (!isValidPassword) {
        throw new Error('')
      }
    } catch (e) {
      console.log(e)
    }
    return true
  }

  async currentDevice(args: unknown, ctx: GQLContext): Promise<Device | null> {
    return ctx.device
  }

  static async hasUniqueCredentials({ email, id }: { email?: string, id?: string }): Promise<boolean> {
    const findQuery = AppDataSource.getRepository(User).createQueryBuilder()
    findQuery.where(new Brackets((sqry) => {
      if (email) {
        sqry.orWhere('LOWER("email") = :email', { email: email.toLowerCase() })
      }
    }))
    if (id) {
      findQuery.andWhere('"id" != :id', { id })
    }
    const testUser = await findQuery.getCount()
    if (testUser) {
      return false
    }
    return true
  }

  async setActiveDevice({ device }: { device: Device }): Promise<void> {
    const otherUsersQry = AppDataSource.getRepository(UserDevice).createQueryBuilder()
    const otherUsers = await otherUsersQry.where('"userId" != :userId', { userId: this.id }).andWhere('"deviceId" = :deviceId', { deviceId: device.id }).getMany()
    for (let o = 0; o < otherUsers.length; o++) {
      otherUsers[o].active = false
      await otherUsers[o].save()
    }

    const getQry = AppDataSource.getRepository(UserDevice).createQueryBuilder()
    const userDevice = await getQry.where('"userId" = :userId', { userId: this.id }).andWhere('"deviceId" = :deviceId', { deviceId: device.id }).getOne()
    if (userDevice) {
      userDevice.active = true
      userDevice.updatedAt = new Date()
      await userDevice.save()
    } else {
      const insertQry = AppDataSource.getRepository(UserDevice).createQueryBuilder()
      const response = await insertQry.insert().values([{ userId: this.id, deviceId: device.id, active: true }]).execute()
      const insertedId = response.identifiers[0].id
      const getQry = AppDataSource.getRepository(UserDevice).createQueryBuilder()
      const userDevice = await getQry.where({ id: insertedId }).getOne()
      if (!userDevice) {
        throw new GraphQLError('Failed to create user device', { extensions: { code: '500' } })
      }
      userDevice.device = device as unknown as Device
      userDevice.user = this as User
      await userDevice.save()
    }
  }

  async setDefaultRoles(): Promise<void> {
    const qry = 'SELECT * FROM "role" WHERE "isDefaultForRegisteredUser" = TRUE AND "id" NOT IN (SELECT "roleId" FROM "user_role" WHERE "userId" = $1)'
    const roles = await AppDataSource.query(qry, [this.id])
    if (roles.length) {
      for (let r = 0; r < roles.length; r++) {
        await AppDataSource.query('INSERT INTO "user_role" ("userId", "roleId") VALUES ($1, $2)', [this.id, roles[r].id])
      }
    }
  }

  hasPermission = async (permissions: string[], withData: any, forObject: string, andProperty: string | null): Promise<boolean> => {
    if (process.env.AUTH_DISABLED) {
      return true
    }
    for (let p = 0; p < permissions.length; p++) {
      if (this.permissionCache[`${permissions[p]}-${forObject}-${andProperty}`] !== undefined) {
        if (this.permissionCache[`${permissions[p]}-${forObject}-${andProperty}`]) {
          return true
        }
      } else {
        if (!this.permissionIds) {
          const userPermissions = await AppDataSource.query('SELECT "permissionId" FROM "permission_roles" WHERE "roleId" IN (SELECT "roleId" FROM "user_role" WHERE "userId" = $1)', [this.id])
          this.permissionIds = userPermissions.map((userPermission: { permissionId: string }) => userPermission.permissionId)
        }
        if (!this.permissionIds?.length) {
          return false
        }
        const qry = AppDataSource.getRepository(Permission).createQueryBuilder()
        qry.where('"identifier" = :identifier', { identifier: permissions[p] })
          .andWhere('"id" IN (:...ids)', { ids: this.permissionIds })
        const permission = await qry.getOne()
        if (permission) {
          if (!permission.isOwned) {
            this.permissionCache[`${permissions[p]}-${forObject}-${andProperty}`] = true
            return true
          } else {
            const permissionRegistry = PermissionRegistry.shared()
            const hasPermission = await permissionRegistry.resolve(permissions[p], this, withData, forObject, andProperty)
            this.permissionCache[`${permissions[p]}-${forObject}-${andProperty}`] = hasPermission
            if (hasPermission) {
              return true
            }
          }
        } else {
          this.permissionCache[`${permissions[p]}-${forObject}-${andProperty}`] = false
        }
      }
    }
    return false
  }

}
