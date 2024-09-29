import importFromPath from 'import-from-path'
import path from 'path'

export async function buildResolvers(): Promise<void> {
  await importFromPath(path.join(__dirname, '../generated'), /.*resolvers.*/)
  await importFromPath(__dirname, /.*resolvers.*/)
}
