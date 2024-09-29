
export interface FileSchemaCaseDef {
  UCFSingular: string
  LCFSingular: string
  UCFPlural: string
  LCFPlural: string
}

export interface FileSchema {
  singular: string
  plural: string
  implements: string[]
  type: 'INTERFACE' | 'MODEL'
  hasStorage: boolean
  names: FileSchemaCaseDef
  requiresMutations?: boolean
  requiresQueries?: boolean
  version?: number
}
