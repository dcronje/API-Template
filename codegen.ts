
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: 'schema.graphql',
  generates: {
    'src/types/generated.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        noExports: true,
      }
    },
  },
}

export default config
