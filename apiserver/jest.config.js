module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./__tests__/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
  ],
  collectCoverageFrom: [
    'utils/**/*.js',
    'services/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
