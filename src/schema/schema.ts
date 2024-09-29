import importFromPath from 'import-from-path'
import path from 'path'

export async function buildSchema(): Promise<void> {
  await importFromPath(path.join(__dirname, '../generated'), /.*schema.*/)
  await importFromPath(__dirname, /.*schema.*/)
}
