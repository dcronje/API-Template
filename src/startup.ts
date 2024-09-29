import { PermissionRegistry } from '@lib/PermissionRegistry'
import { APIRegistry } from '@simple/api-registry'
import { AppDataSource } from './data-source'

const checkPermissions = async (registry: APIRegistry): Promise<void> => {
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

export const performPostStartupChecks = async (registry: APIRegistry): Promise<void> => {
  await checkPermissions(registry)
}

