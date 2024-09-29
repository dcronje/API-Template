import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, ManyToMany } from 'typeorm'
import { Role } from '@models/index'

@Entity()
export class Permission extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
    id!: string

  @Index({ fulltext: true })
  @Column({ type: 'text', nullable: true })
    identifier: string | null = null

  @Index({ fulltext: true })
  @Column({ type: 'varchar' })
    name!: string

  @Index({ fulltext: true })
  @Column({ type: 'text', nullable: true })
    description: string | null = null

  @ManyToMany(type => Role, role => role.permissions, { lazy: true })
    roles!: Promise<Role[]> | Role[]

  @Column({ type: 'boolean', default: false })
    isOwned!: boolean

  @Column({ type: 'boolean', default: false })
    isDeprecated!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date = new Date()

}
