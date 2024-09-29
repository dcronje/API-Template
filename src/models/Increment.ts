import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Increment extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
    id!: string

  @Column({ type: 'varchar', unique: true })
    key!: string

  @Column({ type: 'int', default: 0 })
    value = 0

  @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date = new Date()

}
