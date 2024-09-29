import { ApolloServer } from '@apollo/server'
import express, { Request, Response, Express } from 'express'
import { createServer, Server } from 'http'
import { corsApp } from '@apps/cors.app'
import { publicApp } from '@apps/static.app'
import { uplaodApp } from '@apps/upload.app'
import { queuesApp } from '@apps/queues.app'
import { json } from 'body-parser'
import { expressMiddleware } from '@apollo/server/express4'

import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { Context } from 'graphql-ws/lib/server'
import { context } from '../context'
import { GQLRegistry } from 'gql-registry'
import CachePlugin, { CacheHitObject, CacheQueryObject } from '@lib/CachePlugin'
import { AppDataSource } from '@root/data-source'
import { CacheHit, CacheQuery } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

let app: Express, server: Server, apolloServer: ApolloServer<GQLContext>, wsServer: WebSocketServer

export const getApp = async (): Promise<{ app: Express, server: Server, apolloServer: ApolloServer<GQLContext> }> => {
  const registry: GQLRegistry = GQLRegistry.shared()

  const schema = await registry.getFederatableSchema()

  if (!app) {
    app = express()
  }

  if (!server) {
    server = createServer(app)
  }

  if (!wsServer) {
    wsServer = new WebSocketServer({
      server: server,
      path: '/graphql',
    })
  }

  if (!apolloServer) {
    const warming = {
      warmingBuffer: 30,
      ttl: 1440,
      processInterval: 10,
      purge: async (minutes: number): Promise<void> => {
        // TODO: 
        await CacheQuery.purgeExpired(minutes)
        await CacheHit.purgeExpired(minutes)
      },
      hitsToWarm: async (minutes: number): Promise<CacheHitObject[]> => {
        const expiringHits = await AppDataSource.getRepository(CacheHit).createQueryBuilder()
          .where(`"cachedUntil" < NOW() + INTERVAL '${minutes} MINUTES'`)
          .getMany()
        return expiringHits
      },
      hasCacheQuery: async (hash: string): Promise<CacheQueryObject | null> => {
        let cacheQuery = await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
          .where('"hash" = :hash', { hash })
          .getOne()
        return cacheQuery
      },
      getCacheQuery: async (cacheQueryId: string): Promise<CacheQueryObject> => {
        let cacheQuery = await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
          .where('"id" = :id', { id: cacheQueryId })
          .getOneOrFail()
        return cacheQuery
      },
      udateCacheQuery: async (cacheQueryId: string, lastRequestTime: Date): Promise<CacheQueryObject> => {
        const cacheQuery = await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
          .where('"id" = :id', { id: cacheQueryId })
          .getOneOrFail()
        const cacheQueryUpdateData: QueryDeepPartialEntity<CacheQuery> = {
          lastRequestTime,
        }
        await AppDataSource.getRepository(CacheQuery).createQueryBuilder()
          .update(cacheQueryUpdateData)
          .where('"id" = :id', { id: cacheQuery.id })
          .execute()
        await cacheQuery.reload()
        return cacheQuery
      },
      createCacheQuery: async (hash: string, query: string, lastRequestTime: Date): Promise<CacheQueryObject> => {
        const cacheQuery = await CacheQuery.create({
          hash,
          query,
          lastRequestTime,
        })
          .save()
        return cacheQuery
      },
      hasCacheHit: async (cacheQueryId: string, variables: any): Promise<CacheHitObject | null> => {
        const cacheHit = await AppDataSource.getRepository(CacheHit).createQueryBuilder()
          .where('"queryId" = :queryId', { queryId: cacheQueryId })
          .andWhere('"variables" = :variables', { variables: variables })
          .getOne()
        return cacheHit
      },
      updateCacheHit: async (cacheHitId: string, lastRequestTime: Date | undefined, cachedUntil: Date): Promise<CacheHitObject> => {
        const cacheHit = await AppDataSource.getRepository(CacheHit).createQueryBuilder()
          .where('"id" = :id', { id: cacheHitId })
          .getOneOrFail()
        const cacheHitUpdateData: QueryDeepPartialEntity<CacheHit> = {
          lastRequestTime,
          cachedUntil,
        }
        await AppDataSource.getRepository(CacheHit).createQueryBuilder()
          .update(cacheHitUpdateData)
          .where('"id" = :id', { id: cacheHit.id })
          .execute()
        await cacheHit.reload()
        return cacheHit
      },
      createCacheHit: async (variables: any, cacheKey: string, cachedUntil: Date, cacheQueryId: string, lastRequestTime: Date): Promise<CacheHitObject> => {
        const cacheHit = await CacheHit.create({
          variables,
          cacheKey,
          cachedUntil,
          queryId: cacheQueryId,
          lastRequestTime,
        })
          .save()
        return cacheHit
      },
    }

    const serverCleanup = useServer({
      schema,
      context: (ctx: Context<{ authorization?: string }>) => {
        return context(ctx?.connectionParams?.authorization as string)
      },
    }, wsServer)
    apolloServer = new ApolloServer<GQLContext>({
      introspection: true,
      schema,
      allowBatchedHttpRequests: true,
      csrfPrevention: true,
      persistedQueries: {
        ttl: 86400, // 24 hours
      },
      plugins: [
        CachePlugin({
          defaultTTTL: 21600, // 6 hour
          logging: false,
          warming,
        }, () => apolloServer),
        ApolloServerPluginDrainHttpServer({ httpServer: server }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose()
              },
            }
          },
        },
      ],
    })

    server.headersTimeout = 7200000
    await apolloServer.start()

    app.get('/healthz', (_req: Request, res: Response) => res.status(200).send('ok'))
    app.use(corsApp)
    app.use(uplaodApp)
    app.use('/queues', queuesApp)
    app.use('/public', publicApp)

    app.use(
      '/graphql',
      json(),
      expressMiddleware(apolloServer, {
        context: ({ req }: { req: Request }) => {
          return context(req?.headers?.authorization)
        },
      }),
    )
  }

  return { app, server, apolloServer }

}
