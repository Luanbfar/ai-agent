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

import { PersonalityAgent } from "../../../src/agents/personality-agent.ts";
import type { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository.ts";

let mockCreate: jest.Mock<any>;

beforeAll(async () => {
  const openaiModule = await import("openai");
  mockCreate = (openaiModule as any).__mockCreate;
});

describe("PersonalityAgent", () => {
  let agent: PersonalityAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new PersonalityAgent();
  });

  it("should create an agent successfully", () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(PersonalityAgent);
  });

  it("should enhance response with professional tone", async () => {
    mockCreate.mockResolvedValue({
      output_text: "At InfinitePay, we're here to help you with your payment processing needs.",
    });

    const messages: ChatMessage[] = [
      { role: "user", content: "What services do you offer?" },
      { role: "assistant", content: "We offer payment processing." },
    ];

    const result = await agent.generate(messages);

    expect(result).toBe("At InfinitePay, we're here to help you with your payment processing needs.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should handle errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));

    const messages: ChatMessage[] = [
      { role: "user", content: "Test" },
      { role: "assistant", content: "Response" },
    ];

    await expect(agent.generate(messages)).rejects.toThrow("Failed to generate response");
  });
});
