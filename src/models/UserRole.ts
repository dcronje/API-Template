import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, BaseEntity, Index } from 'typeorm'
import { User, Role } from '@models/index'

@Entity()
export class UserRole extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
    id!: string

  @Index()
  @ManyToOne(type => User, user => user.userRoles, { lazy: true, onDelete: 'CASCADE' })
    user!: Promise<User> | User | string

  @Index()
  @ManyToOne(type => Role, role => role.userRoles, { lazy: true, onDelete: 'CASCADE' })
    role!: Promise<Role> | Role | string

  @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date = new Date()

}
