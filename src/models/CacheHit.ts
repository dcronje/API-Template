import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Unique, JoinColumn, ManyToOne } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { getClient } from '@lib/RedisHelper'
import { Utilities } from '@lib/Utilities'
import gql from 'graphql-tag'
import { ApolloServer } from '@apollo/server'
import { getApp } from '@apps/main.app'
import { CacheQuery } from '@models/index'

@Entity()
@Unique('query_variables_unique', ['queryId', 'variables'])
export class CacheHit extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  variables!: string

  @Column({ type: 'uuid' })
  queryId!: string

  @ManyToOne(() => CacheQuery, query => query.hits, { lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queryId' })
  query!: Promise<CacheQuery> | CacheQuery

  @Column({ type: 'varchar' })
  cacheKey!: string

  @Column({ type: 'timestamptz' })
  cachedUntil!: Date

  @Column({ type: 'timestamptz' })
  lastRequestTime!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

  static purgeExpired = async (minutes: number): Promise<void> => {
    await AppDataSource.getRepository(CacheHit).createQueryBuilder()
      .delete()
      .where(`"lastRequestTime" < NOW() - INTERVAL '${minutes} MINUTES'`)
      .execute()
  }

  static warmAll = async (minutes: number): Promise<void> => {
    const { apolloServer: server } = await getApp()
    if (server) {
      console.log('WARMING QUERIES')
      const expiringHits = await AppDataSource.getRepository(CacheHit).createQueryBuilder()
        .where(`"cachedUntil" < NOW() + INTERVAL '${minutes} MINUTES'`)
        .getMany()
      for (let e = 0; e < expiringHits.length; e++) {
        await expiringHits[e].warm(server)
      }
    }
  }

  warm = async (server: ApolloServer<GQLContext>): Promise<void> => {
    const cachedQuery = await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
      .where('"id" = :id', { id: this.queryId })
      .getOne()
    if (cachedQuery) {
      const client = await getClient({
        host: process.env.REDIS_CLIENT_CACHE_HOST || 'localhost',
        port: process.env.REDIS_CLIENT_CACHE_PORT ? parseInt(process.env.REDIS_CLIENT_CACHE_PORT) : 6379,
        db: process.env.REDIS_CLIENT_CACHE_DB ? parseInt(process.env.REDIS_CLIENT_CACHE_DB) : 1,
      })
      await client.del(this.cacheKey)
      console.log(`WARMING CACHE FOR ${this.cacheKey}`)
      const result = await server?.executeOperation({
        query: gql`${cachedQuery.query}`,
        variables: JSON.parse(this.variables),
        extensions: {
          cacheWarming: true,
          cacheUpdating: false,
          originalQuery: cachedQuery.query,
        },
      })
      if (result.body.kind === 'incremental') {
        if (result.body.initialResult.hasNext) {
          for await (const chunk of result.body.subsequentResults) {
            // Do nothing just read in order for caching to work
          }
        }
      }
      await Utilities.wait(500)
      const secondaryResult = await server?.executeOperation({
        query: gql`${cachedQuery.query}`,
        variables: JSON.parse(this.variables),
        extensions: {
          cacheWarming: false,
          cacheUpdating: true,
          originalQuery: cachedQuery.query,
        },
      })
      if (secondaryResult.body.kind === 'incremental') {
        if (secondaryResult.body.initialResult.hasNext) {
          for await (const chunk of secondaryResult.body.subsequentResults) {
            // Do nothing just read in order for caching to work
          }
        }
      }
    }
  }

}
