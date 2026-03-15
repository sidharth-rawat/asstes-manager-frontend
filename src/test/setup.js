import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (ensures clean state)
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Shut down MSW server after all tests
afterAll(() => server.close());
