
import cron from 'node-cron'
import { CacheQuery, CacheHit } from '@models/index'

// Every 10 seconds
// */10 * * * * *
// Every 20 seconds
// */20 * * * * *
// Every 5 minutes
// */5 * * * *
// Every hour
// * */1 * * *
// 1 in the morning
// 0 1 * * *

const WARMED_QUERY_TTL = 24 // Hours
const REWARM_BUFFER_PERIOD = 30 // Minutes

cron.schedule('*/5 * * * *', async (): Promise<void> => {
  try {
    // Purge Expired warming queries
    await CacheQuery.purgeExpired(WARMED_QUERY_TTL)
    await CacheHit.purgeExpired(WARMED_QUERY_TTL)
    // Warm cache
    await CacheHit.warmAll(REWARM_BUFFER_PERIOD)
  } catch (e) {
    console.log(e)
  }
})