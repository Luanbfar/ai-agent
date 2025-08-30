import { describe, expect, it, jest, beforeEach, beforeAll } from "@jest/globals";

// Mock OpenAI
jest.mock("openai", () => {
  // Create a jest.fn() to mock the responses.create method
  const mockCreate = jest.fn();

  // Mock class to replace OpenAI class
  class MockOpenAI {
    responses = {
      create: mockCreate,
    };
  }

  return {
    __esModule: true,
    default: MockOpenAI,
    __mockCreate: mockCreate, // expose mockCreate for tests
  };
});

// Mock config
jest.mock("../../../src/config/loadEnv", () => ({
  openaiApiKey: "test-api-key",
}));

// Mock DocumentRetriever
jest.mock("../../../src/rag/retriever", () => {
  const mockRetrieve = jest.fn();
  return {
    DocumentRetriever: jest.fn().mockImplementation(() => ({
      retrieve: mockRetrieve,
    })),
    __mockRetrieve: mockRetrieve,
  };
});

// Import after mocking
import { KnowledgeAgent } from "../../../src/agents/knowledge-agent.ts";
import type { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository.ts";

let mockCreate: jest.Mock<any>;
let mockRetrieve: jest.Mock<any>;

beforeAll(async () => {
  const openaiModule = await import("openai");
  const retrieverModule = await import("../../../src/rag/retriever.ts");
  mockCreate = (openaiModule as any).__mockCreate;
  mockRetrieve = (retrieverModule as any).__mockRetrieve;
});

describe("KnowledgeAgent", () => {
  let agent: KnowledgeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new KnowledgeAgent();
  });

  it("should create an agent successfully", () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(KnowledgeAgent);
  });

  it("should generate response with context from documents", async () => {
    mockRetrieve.mockResolvedValue({
      context: [{ pageContent: "InfinitePay business hours are 9 AM to 6 PM." }],
    });

    mockCreate.mockResolvedValue({
      output_text: "Our business hours are 9 AM to 6 PM, Monday through Friday.",
    });

    const messages: ChatMessage[] = [{ role: "user", content: "What are your business hours?" }];

    const result = await agent.generate(messages);

    expect(result).toBe("Our business hours are 9 AM to 6 PM, Monday through Friday.");
    expect(mockRetrieve).toHaveBeenCalledWith("What are your business hours?");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should handle errors gracefully", async () => {
    mockRetrieve.mockRejectedValue(new Error("Retrieval failed"));

    const messages: ChatMessage[] = [{ role: "user", content: "Test question" }];

    await expect(agent.generate(messages)).rejects.toThrow("Failed to generate response");
  });
});
