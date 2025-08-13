import { describe, expect, it, jest, beforeEach, beforeAll } from "@jest/globals";

// Mock OpenAI module completely
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

// Mock the config to avoid environment issues
jest.mock("../../../src/config/loadEnv", () => ({
  openaiApiKey: "test-api-key",
}));

// Import after mocking
import { CustomerServiceAgent } from "../../../src/agents/cs-agent";
import { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository";

// Declare mockCreate here so it's accessible in tests
let mockCreate: jest.Mock<any>;

beforeAll(async () => {
  const mockModule = await import("openai");
  mockCreate = (mockModule as any).__mockCreate;
});

describe("CustomerServiceAgent", () => {
  let agent: CustomerServiceAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new CustomerServiceAgent();
  });

  it("should create an agent successfully", () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(CustomerServiceAgent);
  });

  it("should generate a simple response", async () => {
    mockCreate.mockResolvedValue({
      output_text: "I can help you with my account issue.",
    });

    const messages: ChatMessage[] = [{ role: "user", content: "I need help with my account" }];

    const result = await agent.generate(messages);

    expect(result).toBe("I can help you with my account issue.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should handle ticket creation", async () => {
    const ticketResponse = JSON.stringify({
      action: "create_ticket",
      subject: "Payment Issue",
      description: "Payment not processing",
      status: "open",
    });

    mockCreate.mockResolvedValue({
      output_text: ticketResponse,
    });

    const messages: ChatMessage[] = [{ role: "user", content: "I want to create a ticket for payment issues" }];

    const result = await agent.generate(messages);

    expect(result).toBe(ticketResponse);
    expect(JSON.parse(result).action).toBe("create_ticket");
  });

  it("should handle errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));

    const messages: ChatMessage[] = [{ role: "user", content: "Test message" }];

    await expect(agent.generate(messages)).rejects.toThrow("Failed to generate response");
  });
});
