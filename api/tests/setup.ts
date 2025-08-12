// tests/setup.ts
import { jest } from "@jest/globals";

// Mock environment variables for tests
process.env["NODE_ENV"] = "test";
process.env["OPENAI_API_KEY"] =
  "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";
process.env["SUPABASE_URL"] = "https://oeenghhttskcutjjflcx.supabase.co";
process.env["SUPABASE_API_KEY"] =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZW5naGh0dHNrY3V0ampmbGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDI4MDksImV4cCI6MjA3MDA3ODgwOX0.pSjS2Egsh_8wzjy3-t5HtdI7TGUssWCLPaP16Eio6kc";
process.env["REDIS_PASSWORD"] = "";
process.env["REDIS_URL"] = "localhost";
process.env["MONGODB_URL"] = "mongodb://localhost:27017/test";
process.env["PORT"] = "3001";

// Set reasonable test timeout
jest.setTimeout(10000);

// Mock console.error to keep test output clean
global.console.error = jest.fn();

export {};
