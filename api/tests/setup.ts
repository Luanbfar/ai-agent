// tests/setup.ts
import { jest } from "@jest/globals";

// Mock environment variables for tests
process.env["NODE_ENV"] = "test";
process.env["OPENAI_API_KEY"] = "";
process.env["SUPABASE_URL"] = "";
process.env["SUPABASE_API_KEY"] = "";
process.env["REDIS_PASSWORD"] = "";
process.env["REDIS_URL"] = "localhost";
process.env["MONGODB_URL"] = "mongodb://localhost:27017/test";
process.env["PORT"] = "3001";

// Global test timeout
jest.setTimeout(15000);

// Mock console.error to reduce noise in tests unless explicitly needed
global.console.error = jest.fn();

// Mock fetch for HTTP requests in tests
global.fetch = jest.fn() as unknown as typeof fetch;

export {};
