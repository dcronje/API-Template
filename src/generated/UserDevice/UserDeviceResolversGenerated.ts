import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { SelectQueryBuilder } from 'typeorm'
import { AppDataSource } from '@root/data-source'
import { ReadStream } from 'typeorm/platform/PlatformTools'
import { UserDevice } from '@models/index'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { clearCacheKeys } from '@lib/CachePlugin'

class UserDeviceResolversGenerated {

}

export default UserDeviceResolversGenerated
