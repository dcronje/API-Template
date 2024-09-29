
import { createHash } from 'crypto'
import { FragmentDefinitionNode, getNamedType, GraphQLInterfaceType, GraphQLList, GraphQLObjectType, GraphQLSchema, IntValueNode, isInterfaceType, isListType, isObjectType, Kind, OperationDefinitionNode, print, SelectionSetNode, StringValueNode } from 'graphql'
import { getClient } from './RedisHelper'
import { parse } from 'tldts'
import { GraphQLRequestContext, ApolloServerPlugin, GraphQLRequestListener, GraphQLResponse, HeaderMap, GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult, GraphQLExperimentalFormattedInitialIncrementalExecutionResult, GraphQLExperimentalFormattedIncrementalDeferResult, GraphQLExperimentalFormattedIncrementalStreamResult, GraphQLExperimentalFormattedIncrementalResult, GraphQLRequestContextResponseForOperation, ApolloServer } from '@apollo/server'
import { GraphQLResponseBody } from '@apollo/server/dist/esm/externalTypes/graphql'
import { Mutable } from '@simple/api-registry'
import Redis from 'ioredis'
import cron from 'node-cron'
import { Utilities } from './Utilities'
import gql from 'graphql-tag'

export interface CacheObject {
  type: string
  id: string
}

const CacheScope: { [k: string]: string } = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
}

const scopeImportance = [
  null,
  CacheScope.PUBLIC,
  CacheScope.PRIVATE,
]

export interface CacheQueryObject {
  id: string
  hash: string
  query: string
  lastRequestTime: Date
}

export interface CacheHitObject {
  id: string
  variables: string
  queryId: string
  cacheKey: string
  cachedUntil: Date
  lastRequestTime: Date
}

export interface CacheHint {
  maxAge?: number
  scope?: string
}

interface CacheValue {
  userId?: String
  data: GraphQLResponseBody<Record<string, unknown>>
  cacheKeys: CacheObject[]
  cachePolicy: Required<CacheHint>
  cacheTime: number // epoch millis, used to calculate Age header
}

const getRedisClient = async (): Promise<Redis> => {
  const client = await getClient({
    host: process.env.REDIS_CACHE_HOST || 'localhost',
    port: process.env.REDIS_CACHE_PORT ? parseInt(process.env.REDIS_CACHE_PORT) : 6379,
    db: process.env.REDIS_CACHE_DB ? parseInt(process.env.REDIS_CACHE_DB) : 1,
  })

  return client
}

const recurseForAgeAndScope = (selectionSet: SelectionSetNode, objectType: GraphQLObjectType | GraphQLInterfaceType | GraphQLList<GraphQLObjectType | GraphQLInterfaceType>, schema: GraphQLSchema, fragments: FragmentDefinitionNode[]): ({ maxAge: number | null, scope: string | null } | null) => {
  let maxAge: number | null = null
  let scope: string | null = null

  const namedType = getNamedType(objectType) as GraphQLObjectType | GraphQLInterfaceType
  if (namedType.astNode?.directives?.find((dir) => dir.name.value === 'NoCache')) {
    return null
  }

  for (let s = 0; s < selectionSet.selections.length; s++) {
    const selection = selectionSet.selections[s]
    if (selection.kind === Kind.FIELD) {
      const name = selection.name.value
      let field = namedType.getFields?.()?.[name]
      if (field && field.astNode?.directives?.find((dir) => dir.name.value === 'NoCache')) {
        return null
      }
      if (isObjectType(namedType) && selection.selectionSet) {
        const directive = namedType.astNode?.directives?.find((dir) => dir.name.value === 'CacheControl')
        if (directive) {
          const maxAgeArg = directive.arguments?.find((arg) => arg.name.value === 'maxAge')
          if (maxAgeArg) {
            const newMaxAge = parseInt((maxAgeArg.value as IntValueNode).value)
            if (newMaxAge < (maxAge || Number.MAX_SAFE_INTEGER)) {
              maxAge = newMaxAge
            }
          }
          const scopeArg = directive.arguments?.find((arg) => arg.name.value === 'scope')
          if (scopeArg) {
            const newScope = (scopeArg.value as StringValueNode).value as string
            if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
              scope = newScope
            }
          }
        }
        const response = recurseForAgeAndScope(selection.selectionSet, field.type as GraphQLObjectType | GraphQLInterfaceType, schema, fragments)
        if (!response) {
          return null
        }
        const { maxAge: newMaxAge, scope: newScope } = response
        if ((newMaxAge || Number.MAX_SAFE_INTEGER) < (maxAge || Number.MAX_SAFE_INTEGER)) {
          maxAge = newMaxAge
        }
        if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
          scope = newScope
        }
      } else if (field) {
        const directive = field.astNode?.directives?.find((dir) => dir.name.value === 'CacheControl')
        if (directive) {
          const maxAgeArg = directive.arguments?.find((arg) => arg.name.value === 'maxAge')
          if (maxAgeArg) {
            const newMaxAge = parseInt((maxAgeArg.value as IntValueNode).value)
            if (newMaxAge < (maxAge || Number.MAX_SAFE_INTEGER)) {
              maxAge = newMaxAge
            }
          }
          const scopeArg = directive.arguments?.find((arg) => arg.name.value === 'scope')
          if (scopeArg) {
            const newScope = (scopeArg.value as StringValueNode).value as string
            if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
              scope = newScope
            }
          }
        }
      }
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments.find((fra) => fra.name.value === selection.name.value)
      if (fragment) {
        const namedType = schema.getType(fragment.typeCondition.name.value)
        if (namedType && isObjectType(namedType)) {
          const response = recurseForAgeAndScope(fragment?.selectionSet, namedType, schema, fragments)
          if (!response) {
            return null
          }
          const { maxAge: newMaxAge, scope: newScope } = response
          if ((newMaxAge || Number.MAX_SAFE_INTEGER) < (maxAge || Number.MAX_SAFE_INTEGER)) {
            maxAge = newMaxAge
          }
          if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
            scope = newScope
          }
        }
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT && selection.typeCondition) {
      const namedType = schema.getType(selection.typeCondition.name.value)
      if (namedType && isObjectType(namedType)) {
        const response = recurseForAgeAndScope(selection.selectionSet, namedType, schema, fragments)
        if (!response) {
          return null
        }
        const { maxAge: newMaxAge, scope: newScope } = response
        if ((newMaxAge || Number.MAX_SAFE_INTEGER) < (maxAge || Number.MAX_SAFE_INTEGER)) {
          maxAge = newMaxAge
        }
        if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
          scope = newScope
        }
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (namedType && isObjectType(namedType)) {
        const response = recurseForAgeAndScope(selection.selectionSet, namedType, schema, fragments)
        if (!response) {
          return null
        }
        const { maxAge: newMaxAge, scope: newScope } = response
        if ((newMaxAge || Number.MAX_SAFE_INTEGER) < (maxAge || Number.MAX_SAFE_INTEGER)) {
          maxAge = newMaxAge
        }
        if (scopeImportance.indexOf(newScope) > scopeImportance.indexOf(scope)) {
          scope = newScope
        }
      }
    } else {
      console.log('UNKNOWN SELECTION TYPE IN CACHE PLUGIN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      console.log(selection)
    }
  }

  return { maxAge, scope }
}


const getScopeAndAgeForQuery = async (requestContext: GraphQLRequestContext<GQLContext>, defaultTTL = 0): Promise<{ maxAge: number | null, scope: string | null } | null> => {

  const selectionSet = requestContext.operation?.selectionSet
  const namedType = requestContext.schema.getType('Query') as GraphQLObjectType
  if (selectionSet && namedType) {
    if (namedType?.extensionASTNodes?.find((ext) => ext.directives?.find((dir) => dir.name.value === 'NoCache'))) {
      return null
    }
    if (namedType.astNode?.directives?.find((dir) => dir.name.value === 'NoCache')) {
      return null
    }
    const fragments = requestContext.document?.definitions.filter((def) => def.kind === Kind.FRAGMENT_DEFINITION) as FragmentDefinitionNode[]
    const response = recurseForAgeAndScope(selectionSet, namedType, requestContext.schema, fragments)
    if (!response) {
      return null
    }
    let { maxAge, scope } = response
    if (!maxAge && defaultTTL) {
      maxAge = defaultTTL
    }
    if (!scope) {
      scope = CacheScope.PUBLIC
    }
    return { maxAge, scope }
  }
  return { maxAge: defaultTTL, scope: CacheScope.PUBLIC }

}

const sortObjectByKeys = (object: { [k: string]: any }): { [k: string]: any } => {
  return Object.keys(object)
    .sort()
    .reduce((accumulator: { [k: string]: any }, key) => {
      accumulator[key] = object[key]
      return accumulator
    }, {})
}

const getCacheKey = async (requestContext: GraphQLRequestContext<GQLContext>, scope: string, keyForRequest?: (requestContext: GraphQLRequestContext<GQLContext>) => string | undefined): Promise<string | null> => {
  if (requestContext.request) {
    let scopeKey = 'PUBLIC'
    const { user } = requestContext.contextValue
    let hasSetKey = false
    if (keyForRequest) {
      const tempKey = keyForRequest(requestContext)
      if (tempKey) {
        scopeKey = tempKey
        hasSetKey = true
      }
    }
    if (!hasSetKey && scope === CacheScope.PRIVATE && user) {
      scopeKey = 'User:' + user.id
    }
    const queryHash = requestContext?.queryHash
    const hashString =
      queryHash
        ? (
          scopeKey +
          queryHash +
          (requestContext.request.variables ? JSON.stringify(sortObjectByKeys(requestContext.request.variables as { [k: string]: any })) : '{}')
        )
        : (
          scopeKey +
          (requestContext.request.query ? requestContext.request.query : 'NO_QUERY') +
          (requestContext.request.operationName ? requestContext.request.operationName : 'UNKNOWN') +
          (requestContext.request.variables ? JSON.stringify(sortObjectByKeys(requestContext.request.variables as { [k: string]: any })) : '{}')
        )
    return createHash('sha256').update(hashString).digest('hex')
  }

  return null
}

const saveCacheWarmingHit = async (cacheKey: string, value: CacheValue, requestContext: GraphQLRequestContext<GQLContext>, warming?: WarmingOptions): Promise<void> => {
  if (value.cachePolicy.scope !== CacheScope.PUBLIC || !warming) {
    return
  }
  if (requestContext?.document) {
    const isCacheUpdating = requestContext.request?.extensions?.cacheWarming || requestContext.request?.extensions?.cacheUpdating
    const query = requestContext.request?.extensions?.originalQuery || print(requestContext?.document)
    const hash = createHash('sha256').update(query).digest('hex')
    if (hash) {
      for (let d = 0; d < (requestContext?.document?.definitions?.length || 0); d++) {
        if (requestContext.document?.definitions?.[d].kind === Kind.OPERATION_DEFINITION) {
          const lastRequestTime = isCacheUpdating ? undefined : new Date()
          const definition = requestContext.document?.definitions?.[d] as OperationDefinitionNode
          const queryIdentifierDirective = definition?.directives?.find((dir) => dir.name.value === 'cacheWarming')
          if (queryIdentifierDirective) {
            let cacheQuery = await warming.hasCacheQuery(hash)
            if (cacheQuery && lastRequestTime) {
              cacheQuery = await warming.udateCacheQuery(cacheQuery.id, lastRequestTime)
            } else if (lastRequestTime) {
              cacheQuery = await warming.createCacheQuery(hash, query, lastRequestTime)
            }
            if (cacheQuery) {
              let cacheHit = await warming.hasCacheHit(cacheQuery.id, JSON.stringify(requestContext.request.variables || '{}'))
              if (cacheHit) {
                cacheHit = await warming.updateCacheHit(cacheHit.id, lastRequestTime, new Date(value.cacheTime + (value.cachePolicy.maxAge * 1000)))
              } else if (lastRequestTime) {
                await warming.createCacheHit(JSON.stringify(requestContext.request.variables || '{}'), cacheKey, new Date(value.cacheTime + (value.cachePolicy.maxAge * 1000)), cacheQuery.id, lastRequestTime)
              }
            }
          }
        }
      }
    }
  }
}

const getCacheResult = async (key: string): Promise<CacheValue | null> => {
  const client = await getRedisClient()
  const result = await client.get(key)
  const parsedResult = result ? JSON.parse(result) as CacheValue : null
  return parsedResult
}

const setCacheResult = async (key: string, cacheKeys: CacheObject[], cachePolicy: Required<CacheHint>, data: Record<string, any>, userId: string | undefined): Promise<void> => {
  const client = await getRedisClient()
  const cacheData = {
    userId,
    data,
    cacheKeys,
    cachePolicy,
    cacheTime: +new Date(),
  }
  await client.set(key, JSON.stringify(cacheData), 'EX', cachePolicy.maxAge)
}

const isGraphQLQuery = (requestContext: GraphQLRequestContext<any>): boolean => {
  return requestContext.operation?.operation === 'query'
}

export const indexCache = async (): Promise<{ [k: string]: { [k: string]: string[] } }> => {

  const index: { [k: string]: { [k: string]: string[] } } = {}
  const client = await getRedisClient()
  const stream = client.scanStream()

  return new Promise<{ [k: string]: { [k: string]: string[] } }>((resolve) => {
    stream.on('data', async (resultKeys: any) => {
      for (let i = 0; i < resultKeys.length; i++) {
        const key = resultKeys[i]
        const record = await client.get(key)
        if (record) {
          const cacheValue = JSON.parse(record) as CacheValue
          const { cacheKeys } = cacheValue
          cacheKeys.forEach((cacheKey) => {
            if (!index[cacheKey.type]) {
              index[cacheKey.type] = {}
            }
            if (!index[cacheKey.type][cacheKey.id]) {
              index[cacheKey.type][cacheKey.id] = []
            }
            if (!index[cacheKey.type][cacheKey.id].includes(key)) {
              index[cacheKey.type][cacheKey.id].push(key)
            }
          })
        }
      }
    })
    stream.on('end', () => {
      resolve(index)
    })
  })

}

const validateCacheForKeys = (cacheValue: CacheValue, clearKeys?: { type: string, id?: string }[], userId?: string): boolean => {
  if (clearKeys && userId) {
    const { cacheKeys, userId: cachedUserId } = cacheValue
    if (cachedUserId == userId) {
      clearKeys.forEach((clearKey) => {
        if (clearKey.id) {
          const hasItem = cacheKeys.find((cacheKey) => cacheKey.type === clearKey.type && cacheKey.id === clearKey.id)
          if (hasItem) {
            return true
          }
        } else {
          const hasItem = cacheKeys.find((cacheKey) => cacheKey.type === clearKey.type)
          if (hasItem) {
            return true
          }
        }
      })
    }
  } else if (clearKeys) {
    const { cacheKeys } = cacheValue
    clearKeys.forEach((clearKey) => {
      if (clearKey.id) {
        const hasItem = cacheKeys.find((cacheKey) => cacheKey.type === clearKey.type && cacheKey.id === clearKey.id)
        if (hasItem) {
          return true
        }
      } else {
        const hasItem = cacheKeys.find((cacheKey) => cacheKey.type === clearKey.type)
        if (hasItem) {
          return true
        }
      }
    })
  } else if (userId) {
    const { userId: cachedUserId } = cacheValue
    if (cachedUserId == userId) {
      return true
    }
  } else {
    return true
  }
  return false
}

export const clearCacheKeys = async (clearKeys?: { type: string, id?: string }[], userId?: string | undefined): Promise<void> => {

  const client = await getRedisClient()

  return new Promise<void>((resolve, reject) => {
    const removeKeys: string[] = []
    const stream = client.scanStream()
    let streamHasEnded = false
    let streamHasReoslved = false
    let hasFinishedProcessing = false

    const resolveStream = async () => {
      if (streamHasEnded && !streamHasReoslved) {
        for (let r = 0; r < removeKeys.length; r++) {
          await client.del(removeKeys[r])
          console.log(`REMOVED: ${removeKeys[r]}`)
        }
        streamHasReoslved = true
        resolve()
      }
    }

    stream.on('data', async (resultKeys: any) => {
      stream.pause()
      for (let i = 0; i < resultKeys.length; i++) {
        const key = resultKeys[i]
        const record = await client.get(key)
        if (record) {
          const cacheValue = JSON.parse(record) as CacheValue
          const shouldClear = validateCacheForKeys(cacheValue, clearKeys, userId)
          if (shouldClear && !removeKeys.includes(key)) {
            console.log('REMOVING: ')
            console.log(cacheValue)
            removeKeys.push(key)
          }
        }
      }
      stream.resume()
      hasFinishedProcessing = true
      if (streamHasEnded) {
        resolveStream()
      }
    })

    stream.on('error', (err: Error) => {
      console.log(err)
      reject(err)
    })

    stream.on('end', async () => {
      streamHasEnded = true
      if (hasFinishedProcessing) {
        resolveStream()
      }
    })
  })

}

const recurseIncrementResponse = (path: any[], initialData: any, data: any): any => {
  if (path.length) {
    const currentPath = path.pop()
    if (Number.isInteger(currentPath)) {
      if (initialData.length < currentPath) {
        for (let i = initialData.length - 1; i < currentPath; i++) {
          initialData.push({})
        }
      }
      initialData[currentPath] = {
        ...initialData[currentPath],
        ...recurseIncrementResponse(path, initialData[currentPath], data)
      }
      return initialData
    } else {
      const recursedData = recurseIncrementResponse(path, initialData[currentPath], data)
      if (Array.isArray(recursedData)) {
        return {
          ...initialData,
          [currentPath]: recursedData,
        }
      } else {
        return {
          ...initialData,
          [currentPath]: {
            ...initialData[currentPath],
            ...recursedData,
          },
        }
      }
    }
  }
  return data
}

const recomposeResponse = (body: GraphQLResponseBody<Record<string, unknown>>): GraphQLResponseBody<Record<string, unknown>> => {
  if (body.kind === 'incremental') {
    let initialResultData = { ...body.initialResult.data }
    if (body.initialResult.hasNext) {
      const subsequentResults = [...body.subsequentResults as unknown as GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[]]
      for (let s = 0; s < subsequentResults.length; s++) {
        const subsequentResult = subsequentResults[s]
        subsequentResult.incremental?.forEach((increment) => {
          if ((increment as GraphQLExperimentalFormattedIncrementalDeferResult).data) {
            initialResultData = recurseIncrementResponse([...increment.path!].reverse(), initialResultData, (increment as GraphQLExperimentalFormattedIncrementalDeferResult).data)
          } else if ((increment as GraphQLExperimentalFormattedIncrementalStreamResult).items) {
            (increment as GraphQLExperimentalFormattedIncrementalStreamResult).items?.forEach((item) => {
              initialResultData = recurseIncrementResponse([...increment.path!].reverse(), initialResultData, item)
            })
          }
        })
      }
      return {
        kind: 'single',
        singleResult: {
          data: initialResultData,
          extensions: body.initialResult.extensions,
        }
      }
    }
  }
  return body
}

const condenseResponse = (body: GraphQLResponseBody<Record<string, unknown>>): GraphQLResponseBody<Record<string, unknown>> => {
  if (body.kind === 'incremental') {
    if (body.initialResult.hasNext) {
      const subsequentResults = [...body.subsequentResults as unknown as Mutable<GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult>[]]
      const increments = [] as GraphQLExperimentalFormattedIncrementalResult[]
      for (let s = 0; s < subsequentResults.length; s++) {
        const subsequentResult = subsequentResults[s]
        subsequentResult.incremental?.forEach((increment) => {
          increments.push(increment)
        })
      }
      const newSubsequentResults: GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[] = [{
        ...subsequentResults[0],
        incremental: increments,
        hasNext: false,
      }]
      return {
        kind: 'incremental',
        initialResult: body.initialResult,
        subsequentResults: newSubsequentResults as unknown as AsyncIterable<GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult>,
      }
    }
  }
  return body
}

const processClearCacheHeaders = async (requestContext: GraphQLRequestContextResponseForOperation<GQLContext>, options: Options): Promise<void> => {
  const clearCacheHeader = requestContext.request.http?.headers.get('clear-cache')
  if (clearCacheHeader) {
    let domainCanClearCache = true
    if (options?.clearDomainWhitelist) {
      const hostnameTemp = requestContext.request.http?.headers.get('hostname')
        || requestContext.request.http?.headers.get('referer')
        || 'unknown'
      const { hostname } = parse(hostnameTemp)
      domainCanClearCache = Boolean(options?.clearDomainWhitelist?.find((domain) => {
        return hostname?.match(domain)
      }))
    }
    if (domainCanClearCache) {
      const cacheObjectStrings = clearCacheHeader.split(' ')
      const cachableObjects = cacheObjectStrings?.map((cacheObjectString) => {
        const parts = cacheObjectString.split(':')
        if (parts.length > 1) {
          return {
            type: parts[0],
            id: parts[1],
          }
        }
        return {
          type: parts[0]
        }
      })
      if (options.logging) {
        console.log('Clearing cache-keys:')
        console.log(JSON.stringify(cachableObjects, null, 2))
      }
      let shouldClear = true
      if (options.onCacheClear) {
        shouldClear = await options.onCacheClear(cachableObjects, requestContext)
      }
      if (shouldClear) {
        await clearCacheKeys(cachableObjects)
      }
    }
  }
}

interface WarmingOptions {
  // Add Cron:
  warmingBuffer: number
  ttl: number
  processInterval: number

  // Add callback functions
  purge: (minutes: number) => Promise<void>
  hitsToWarm: (minutes: number) => Promise<CacheHitObject[]>
  hasCacheQuery: (hash: string) => Promise<CacheQueryObject | null>
  getCacheQuery: (cacheQueryId: string) => Promise<CacheQueryObject>
  udateCacheQuery: (cacheQueryId: string, lastRequestTime: Date) => Promise<CacheQueryObject>
  createCacheQuery: (hash: string, query: string, lastRequestTime: Date) => Promise<CacheQueryObject>
  hasCacheHit: (cacheQueryId: string, variables: any) => Promise<CacheHitObject | null>
  updateCacheHit: (cacheHitId: string, lastRequestTime: Date | undefined, cachedUntil: Date) => Promise<CacheHitObject>
  createCacheHit: (variables: any, cacheKey: string, cachedUntil: Date, cacheQueryId: string, lastRequestTime: Date) => Promise<CacheHitObject>
}

interface Options {
  defaultTTTL?: number
  logging?: boolean
  noCacheDomainWhitelist?: string[]
  clearDomainWhitelist?: string[]
  onCacheClear?: (cacheObjects: { type: string, id?: string }[], requestContext: GraphQLRequestContext<GQLContext>) => Promise<boolean>
  onNoCache?: (requestContext: GraphQLRequestContext<GQLContext>) => Promise<boolean>

  // Define custom scopes
  cacheScopes?: string[],
  keyForRequest?: (requestContext: GraphQLRequestContext<GQLContext>) => string | undefined

  warming?: WarmingOptions

}

export default function CachePlugin(options: Options, getServer: () => ApolloServer<GQLContext>): ApolloServerPlugin {

  let hasProcessedSchema = false
  const interfaceObjects: { [k: string]: string[] } = {}

  if (options.cacheScopes) {
    options.cacheScopes.forEach((scope) => CacheScope[scope] = scope)
  }

  if (options.warming) {
    cron.schedule(`'*/${options.warming.processInterval} * * * *'`, async (): Promise<void> => {
      try {
        // Purge Expired warming queries
        await options.warming!.purge(options.warming!.ttl)
        // Warm cache
        const server = getServer()
        const hitsToWarm = await options.warming!.hitsToWarm(options.warming!.warmingBuffer)
        for (let h = 0; h < hitsToWarm.length; h++) {
          const cacheHit = hitsToWarm[h]
          const cachedQuery = await options.warming!.getCacheQuery(cacheHit.queryId)
          const client = await getClient({
            host: process.env.REDIS_CLIENT_CACHE_HOST || 'localhost',
            port: process.env.REDIS_CLIENT_CACHE_PORT ? parseInt(process.env.REDIS_CLIENT_CACHE_PORT) : 6379,
            db: process.env.REDIS_CLIENT_CACHE_DB ? parseInt(process.env.REDIS_CLIENT_CACHE_DB) : 1,
          })
          await client.del(cacheHit.cacheKey)
          console.log(`WARMING CACHE FOR ${cacheHit.cacheKey}`)
          const result = await server?.executeOperation({
            query: gql`${cachedQuery.query}`,
            variables: JSON.parse(cacheHit.variables),
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
            variables: JSON.parse(cacheHit.variables),
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
      } catch (e) {
        console.log(e)
      }
    })
  }

  const recurseObjectForCacheKeys = (data: any): CacheObject[] => {
    let cacheKeys: CacheObject[] = []
    if (!data) {
      return cacheKeys
    }
    if (typeof data === 'object') {
      if (data.__typename && data.id) {
        interfaceObjects[data.__typename]?.forEach((interfaceType) => cacheKeys.push({ type: interfaceType, id: data.id + '' }))
        cacheKeys.push({ type: data.__typename, id: data.id + '' })
      }
      for (let d = 0; d < Object.keys(data).length; d++) {
        cacheKeys = [...cacheKeys, ...recurseObjectForCacheKeys(data[Object.keys(data)[d]])]
      }
    } else if (Array.isArray(data)) {
      for (let d = 0; d < data.length; d++) {
        cacheKeys = [...cacheKeys, ...recurseObjectForCacheKeys(data[d])]
      }
    }
    return cacheKeys
  }

  return {
    async requestDidStart(outerRequestContext: GraphQLRequestContext<GQLContext>): Promise<GraphQLRequestListener<GQLContext>> {

      if (!hasProcessedSchema) {
        hasProcessedSchema = true
        const schema = outerRequestContext.schema
        const typeMap = schema.getTypeMap()
        Object.keys(typeMap).forEach((typeName) => {
          const type = typeMap[typeName]
          if (isInterfaceType(type)) {
            const possibleTypes = schema.getPossibleTypes(type)
            if (possibleTypes.length) {
              possibleTypes.forEach((possibleType) => {
                if (!interfaceObjects[possibleType.name]) {
                  interfaceObjects[possibleType.name] = []
                }
                if (!interfaceObjects[possibleType.name].includes(type.name)) {
                  interfaceObjects[possibleType.name].push(type.name)
                }
              })
            }
          }
        })
      }

      let age: number | null = null
      let cacheKey: string | null = null
      let cachePolicy: Required<CacheHint> | null = null

      return {
        async responseForOperation(requestContext): Promise<GraphQLResponse | null> {
          requestContext.metrics.responseCacheHit = false
          let noCachingReason = ''
          if (!isGraphQLQuery(requestContext)) {
            await processClearCacheHeaders(requestContext, options)
            return null
          }
          let hasNoCacheHeader = false
          const isCacheWarming = requestContext.request?.extensions?.cacheWarming
          if (isCacheWarming) {
            noCachingReason = 'Internal Cache Warming'
          } else {
            // Clear-Cache
            await processClearCacheHeaders(requestContext, options)

            // Cache-Control: no-cache
            const cacheControlHeader = requestContext.request.http?.headers.get('cache-control')
            if (cacheControlHeader?.includes('no-cache')) {
              hasNoCacheHeader = true
              if (options?.noCacheDomainWhitelist) {
                const hostnameTemp = requestContext.request.http?.headers.get('hostname') ||
                  requestContext.request.http?.headers.get('referer') ||
                  'unknown'
                const { hostname } = parse(hostnameTemp)
                hasNoCacheHeader = Boolean(options?.noCacheDomainWhitelist?.find((domain) => {
                  return hostname?.match(domain)
                }))
              }
              if (options.onNoCache) {
                hasNoCacheHeader = await options.onNoCache(requestContext)
              }
            }
          }
          if (!hasNoCacheHeader) {
            if (requestContext.operation.name?.value !== 'IntrospectionQuery') {
              let response: any
              try {
                response = await getScopeAndAgeForQuery(requestContext, options.defaultTTTL)
              } catch (e) {
                console.log(e)
              }
              noCachingReason = 'NoCache Directive'
              if (response) {
                noCachingReason = 'No Scope'
                const { scope, maxAge } = response
                if (scope && maxAge) {
                  cacheKey = await getCacheKey(requestContext, scope, options.keyForRequest)
                  cachePolicy = { scope, maxAge }
                  noCachingReason = 'No Cache Key'
                  if (cacheKey) {
                    const value = await getCacheResult(cacheKey)
                    noCachingReason = 'No Cache Result'
                    if (value) {
                      requestContext.metrics.responseCacheHit = true
                      age = Math.round((+new Date() - value.cacheTime) / 1000)
                      await saveCacheWarmingHit(cacheKey, value, requestContext)
                      if (options.logging) {
                        console.log(`Returning cache for: ${requestContext.operation.name?.value}`)
                        console.log(`with age: ${age} and scope: ${scope} and key: ${cacheKey}`)
                      }
                      let recomposeDirective = false
                      for (let d = 0; d < (requestContext?.document?.definitions?.length || 0); d++) {
                        const definition = requestContext.document?.definitions?.[d] as OperationDefinitionNode
                        recomposeDirective = !!definition?.directives?.find((dir) => dir.name.value === 'recomposeCache')
                      }
                      let condenseDirective = false
                      for (let d = 0; d < (requestContext?.document?.definitions?.length || 0); d++) {
                        const definition = requestContext.document?.definitions?.[d] as OperationDefinitionNode
                        condenseDirective = !!definition?.directives?.find((dir) => dir.name.value === 'condenseCache')
                      }
                      if (value.data.kind === 'incremental' && recomposeDirective) {
                        // const subResults = value.data.subsequentResults as unknown as GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[]
                        // const subsequentResults = async function* (): AsyncIterable<GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult> {
                        //   for (let s = 0; s < subResults.length; s++) {
                        //     console.log(subResults[s])
                        //     yield subResults[s]
                        //   }
                        //   return
                        // }
                        // const body = {
                        //   ...value.data,
                        //   subsequentResults: subsequentResults(),
                        // }
                        if (options.logging) {
                          console.log(`Recomposing cache for: ${requestContext.operation.name?.value} from incremental to single response type`)
                        }
                        const body = recomposeResponse(value.data)
                        return {
                          body: body,
                          http: {
                            status: undefined,
                            headers: new HeaderMap(),
                          }
                        }
                      } else if (value.data.kind === 'incremental' && condenseDirective) {
                        const additionalResponseCount = (value.data.subsequentResults as unknown as GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[]).length
                        if (options.logging) {
                          console.log(`Condensing cache for: ${requestContext.operation.name?.value} from ${additionalResponseCount} to 1`)
                        }
                        const body = condenseResponse(value.data)
                        return {
                          body: body,
                          http: {
                            status: undefined,
                            headers: new HeaderMap(),
                          }
                        }
                      } else {
                        const body = { ...value.data }
                        return {
                          body,
                          http: {
                            status: undefined,
                            headers: new HeaderMap(),
                          },
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            noCachingReason = 'No Cache header'
          }
          if (!requestContext.metrics.responseCacheHit && options.logging) {
            console.log(`Not returning cache for: ${requestContext.operation.name?.value}`)
            console.log(noCachingReason)
          }
          return null
        },

        async willSendResponse(requestContext) {
          if (!isGraphQLQuery(requestContext)) {
            return
          }
          if (requestContext.metrics.responseCacheHit) {
            const http = requestContext.response.http
            if (http && age !== null) {
              http.headers.set('age', age.toString())
              http.headers.set('cache-control', 'max-age=' + cachePolicy?.maxAge)
            }
            return
          }
          if (cacheKey && cachePolicy) {
            const { response, errors } = requestContext
            let data: any = null
            if (response.body.kind === 'single') {
              data = response.body
              if (data && !errors) {
                const cacheKeys = recurseObjectForCacheKeys(data)
                setCacheResult(cacheKey, cacheKeys, cachePolicy, data, requestContext.contextValue?.user?.id)
              }
            } else if (response.body.kind === 'incremental') {
              const initilaResults = response.body.initialResult
              const data = {
                initialResult: { ...initilaResults },
                subsequentResults: [] as GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[],
                kind: 'incremental',
              }
              const iterable = response.body.subsequentResults
              const newIterator = async function* (): AsyncIterable<GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult> {
                const iterableData: GraphQLExperimentalFormattedSubsequentIncrementalExecutionResult[] = []
                for await (const result of iterable) {
                  iterableData.push(result)
                  yield result
                }
                data.subsequentResults = iterableData
                const cacheKeys = recurseObjectForCacheKeys(data)
                setCacheResult(cacheKey!, cacheKeys, cachePolicy!, data, requestContext.contextValue?.user?.id)
                return
              }
              response.body.subsequentResults = newIterator()
            }
          }
        },
      }
    },
  }
}
