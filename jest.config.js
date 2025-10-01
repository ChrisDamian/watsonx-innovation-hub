module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/modules'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'modules/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!modules/**/types/**/*.ts',
    '!**/*.config.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1'
  },
  projects: [
    {
      displayName: 'Core Platform',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Mental Health Module',
      testMatch: ['<rootDir>/modules/mental-health/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Frontend Components',
      testMatch: ['<rootDir>/frontend/**/*.test.tsx'],
      testEnvironment: 'jsdom'
    }
  ]
};