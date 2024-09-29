import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable, BaseEntity } from 'typeorm'
import { UserRole, Permission } from '@models/index'

@Entity()
export class Role extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @OneToMany(type => UserRole, userRole => userRole.role, { lazy: true })
  userRoles!: Promise<Array<UserRole>> | Array<UserRole>

  @ManyToMany(type => Permission, permission => permission.roles, { lazy: true })
  @JoinTable({ name: 'permission_roles' })
  permissions!: Promise<Permission[]> | Permission[]

  @Column({ type: 'boolean', default: false })
  isDefaultForRegisteredUser!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

}
