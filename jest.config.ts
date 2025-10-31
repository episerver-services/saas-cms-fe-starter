import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const base = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
}

const config = async () => {
  // Node env: route/API/middleware tests
  const nodeProject = await createJestConfig({
    ...base,
    displayName: 'node-routes',
    testEnvironment: 'node',
    testMatch: [
      '**/*.route.test.[jt]s?(x)',
      '**/*.api.test.[jt]s?(x)',
      '**/route.test.[jt]s?(x)',
      '**/middleware.test.[jt]s?(x)', // ✅ GLOB version (not regex)
    ],
  })()

  // jsdom: everything else (exclude node-only)
  const jsdomProject = await createJestConfig({
    ...base,
    displayName: 'jsdom-ui',
    testEnvironment: 'jsdom',
    testMatch: ['**/*.(test|spec).[jt]s?(x)'],
    testPathIgnorePatterns: [
      ...base.testPathIgnorePatterns,
      '.*\\.route\\.test\\.[jt]sx?$',
      '.*\\.api\\.test\\.[jt]sx?$',
      '.*/route\\.test\\.[jt]sx?$',
      '.*/middleware\\.test\\.[jt]sx?$', // ✅ regex version (ignored by jsdom)
    ],
  })()

  return { projects: [nodeProject, jsdomProject] }
}

export default config