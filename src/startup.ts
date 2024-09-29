import { PermissionRegistry } from '@lib/PermissionRegistry'
import { GQLRegistry } from 'gql-registry'
import { AppDataSource } from './data-source'

const checkPermissions = async (registry: GQLRegistry): Promise<void> => {
  const permissionRegistry = new PermissionRegistry()
  await permissionRegistry.startup(registry)
}

export const createDatabaseConnection = async (): Promise<void> => {
  try {
    await AppDataSource.initialize()
    console.log('Data Source has been initialized!')
  } catch (e) {
    console.error('Error during Data Source initialization', e)
  }
}

export const performPreStartupChecks = async (): Promise<void> => {
  await createDatabaseConnection()
}

export const performPostStartupChecks = async (registry: GQLRegistry): Promise<void> => {
  await checkPermissions(registry)
}

