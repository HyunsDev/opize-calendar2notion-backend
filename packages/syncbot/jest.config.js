//jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
    testTimeout: 300000,
};
