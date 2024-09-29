export default {
  roots: [
    '<rootDir>/src/tests',
  ],
  testMatch: [
    '**/*.tests.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    '^@generated/(.*)$': '<rootDir>/src/generated/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@apps/(.*)$': '<rootDir>/src/apps/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@acuModels/(.*)$': '<rootDir>/src/lib/acumatica/model/$1',
    '^@acuService/(.*)$': '<rootDir>/src/lib/acumatica/service/$1',
    '^@schema/(.*)$': '<rootDir>/src/schema/$1',
    '^@GQLtypes/(.*)$': '<rootDir>/src/schema/types/$1',
    '^@GQLscalars/(.*)$': '<rootDir>/src/schema/scalars/$1',
    '^@GQLdirectives/(.*)$': '<rootDir>/src/schema/directives/$1',
    '^@GQLglobals/(.*)$': '<rootDir>/src/schema/globals/$1',
    '^@root/(.*)$': '<rootDir>/src/$1',
  },
}
