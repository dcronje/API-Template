import { User } from '@models/index'

export { }

declare global {

  const __basedir: string

  export type DBRecord = {
    id: string | null
    [x: string]: any
  }

  export type ID = string

  export interface StringTMap<T> { [key: string]: T }

  export interface ObjectQLInterface { }

  export type RegistryObjectsMap = StringTMap<ObjectQLInterface>

  export interface GQLContext {
    user: User | null
    device: Device | null
    userId: string | null
    token: string | null
  }

  export type $TSFixMe = any

  export type AcumaticaValue<T> = { value: T }
}
