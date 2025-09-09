import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const base = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
}

const config = async () => {
  // Node env: route/API tests
  const nodeProject = await createJestConfig({
    ...base,
    displayName: 'node-routes',
    testEnvironment: 'node',
    testMatch: [
      '**/*.route.test.[jt]s?(x)',
      '**/*.api.test.[jt]s?(x)',
      '**/route.test.[jt]s?(x)', // 👈 pick up app/.../route.test.ts
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
      '.*/route\\.test\\.[jt]sx?$', // 👈 keep route.test.* out of jsdom
    ],
  })()

  return { projects: [nodeProject, jsdomProject] }
}

export default config
