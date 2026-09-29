module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'repositories/**/*.js',
    '!repositories/**/index.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};