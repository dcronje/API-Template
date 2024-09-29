import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BaseEntity } from 'typeorm'
import { File } from '@models/index'

@Entity()
export class FileCategory extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @ManyToMany(type => File, file => file.categories, { lazy: true, nullable: true, onDelete: 'CASCADE' })
  @JoinTable({ name: 'file_category_files' })
  files?: Promise<File[]> | File[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

}
