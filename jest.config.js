module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '\\.(webp)$': '<rootDir>/test/asset-mock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
