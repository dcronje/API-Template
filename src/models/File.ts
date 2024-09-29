import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, TableInheritance, CreateDateColumn, UpdateDateColumn, ManyToMany, Index } from 'typeorm'
import { FileCategory } from '@models/index'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class File extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'text' })
  location!: string

  @Index()
  @Column({ type: 'varchar' })
  key!: string

  @Column({ type: 'varchar' })
  bucket!: string

  @Column({ type: 'varchar' })
  filename!: string

  @Index()
  @Column({ type: 'varchar' })
  mimetype!: string

  @Index()
  @Column({ type: 'varchar' })
  extension!: string

  @ManyToMany(type => FileCategory, category => category.files, { lazy: true, nullable: true, onDelete: 'CASCADE' })
  categories?: Promise<FileCategory[]> | FileCategory[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

}
