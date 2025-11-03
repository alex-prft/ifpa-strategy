/**
 * Jest test setup configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.API_SECRET_KEY = 'test-secret-key';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep log and warn for debugging
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

// Mock fetch for tests that don't actually hit the API
global.fetch = jest.fn();

// Setup global beforeEach and afterEach
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});