import path from 'path'
// @ts-ignore
import env from 'node-env-file'

if (!process.env.HAS_LOADED_ENV) {
  const envFile = path.join(__dirname, '/.env')
  env(envFile)
}

const entities = ['src/models/index.ts']
const migrations = ['src/migration/*.ts']
const subscribers = ['src/subscriber/*.ts']

export default {
  // skip: true,
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'wms',
  password: process.env.DB_PASS || 'wms',
  database: process.env.DB_NAME || 'wms',
  synchronize: false,
  logging: ['error'],
  extra: {
    // based on  https://node-postgres.com/api/pool
    // max connection pool size
    max: process.env.DB_CONNECTIONS || 50,
    // connection timeout
    connectionTimeoutMillis: 30000,
  },
  // logging: true,
  entities,
  migrations,
  subscribers,
  cli: {
    entitiesDir: 'src/models/index.ts',
    migrationsDir: 'src/migration/*.ts',
    subscribersDir: 'src/subscriber/*.ts',
  },
}
