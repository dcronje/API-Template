import 'reflect-metadata'
import './env'
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT as string) || 5432,
  username: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || '',
  entities: ['src/models/index.ts'],
  migrations: ['src/migration/*.ts'],
  logging: ['error'],
  extra: {
    max: 100,
    connectionTimeoutMillis: 30000,
  },
})

// export default async (): Promise<DataSource> => {
//   if (!AppDataSource.isInitialized) {
//     await AppDataSource.initialize()
//       .then(() => {
//         console.log('Data Source has been initialized!')
//       })
//       .catch((err) => {
//         console.error('Error during Data Source initialization', err)
//       })
//   }
//   return AppDataSource
// }
