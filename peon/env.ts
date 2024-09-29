import path from 'path'
// @ts-ignore
import env from 'node-env-file'

if (!process.env.HAS_LOADED_ENV) {
  let envFile = path.join(__dirname, '../', '/.env')
  if (process.env.NODE_ENV === 'production') {
    envFile = path.join(__dirname, '../../', '/.env')
  }
  env(envFile)
}
