// tests/mocks/setup-mocks.ts
import { jest } from "@jest/globals";

// Create mock functions that can be imported by tests
export const mockOpenAICreate = jest.fn();
export const mockRedisClient = {
  rPush: jest.fn(),
  lTrim: jest.fn(),
  expire: jest.fn(),
  lRange: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
};
export const mockDocumentRetrieverRetrieve = jest.fn();
export const mockVectorStoreAddDocuments = jest.fn();
export const mockVectorStoreSimilaritySearch = jest.fn();
export const mockIsDocumentUpToDate = jest.fn();
export const mockLogDocumentUpdate = jest.fn();
export const mockProcessDocument = jest.fn();
export const mockFetch = jest.fn();

// Mock OpenAI
jest.mock("openai", () => ({
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: mockOpenAICreate,
    },
  })),
}));

// Mock Redis
jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue(mockRedisClient),
}));

// Mock fetch
jest.mock("node-fetch", () => ({
  default: mockFetch,
}));

// Set up default mock behaviors
export function setupDefaultMocks() {
  // Reset all mocks
  jest.clearAllMocks();

  // OpenAI default response
  mockOpenAICreate.mockResolvedValue({
    output_text: "Mocked AI response",
  });

  // Redis default responses
  mockRedisClient.rPush.mockResolvedValue(1);
  mockRedisClient.lTrim.mockResolvedValue("OK");
  mockRedisClient.expire.mockResolvedValue(1);
  mockRedisClient.lRange.mockResolvedValue([]);
  mockRedisClient.del.mockResolvedValue(1);
  mockRedisClient.on.mockReturnValue(undefined);
  mockRedisClient.connect.mockResolvedValue(undefined);

  // Document retriever defaults
  mockDocumentRetrieverRetrieve.mockResolvedValue({ context: [] });
  mockVectorStoreAddDocuments.mockResolvedValue(undefined);
  mockVectorStoreSimilaritySearch.mockResolvedValue([]);
  mockIsDocumentUpToDate.mockResolvedValue(true);
  mockLogDocumentUpdate.mockReturnValue(undefined);
  mockProcessDocument.mockResolvedValue([]);

  // Fetch defaults
  mockFetch.mockResolvedValue({
    ok: true,
    text: jest.fn().mockResolvedValue("<html><body>Test content</body></html>"),
  });
}
