import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, BaseEntity, Unique } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { CacheHit } from '@models/index'

@Entity()
@Unique('hash_unique', ['hash'])
export class CacheQuery extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  hash!: string

  @Column({ type: 'text' })
  query!: string

  @OneToMany(type => CacheHit, cacheHit => cacheHit.query, { lazy: true })
  hits!: Promise<Array<CacheHit>> | Array<CacheHit>

  @Column({ type: 'timestamptz' })
  lastRequestTime!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

  static purgeExpired = async (minutes: number): Promise<void> => {
    await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
      .delete()
      .where(`"lastRequestTime" < NOW() - INTERVAL '${minutes} MINUTES'`)
      .execute()
  }

}
