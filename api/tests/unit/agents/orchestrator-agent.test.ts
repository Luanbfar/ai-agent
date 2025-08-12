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
    __mockCreate: mockCreate, // expose mockCreate for your tests
  };
});

// Mock config
jest.mock("../../../src/config/loadEnv", () => ({
  openaiApiKey: "test-api-key",
}));

// Import after mocking
import { OrchestratorAgent } from "../../../src/agents/orchestrator-agent";
import { AgentType } from "../../../src/types/AgentType";
import { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository";

let mockCreate: jest.Mock<any>;

beforeAll(async () => {
  const openaiModule = await import("openai");
  mockCreate = (openaiModule as any).__mockCreate;
});

describe("OrchestratorAgent", () => {
  let agent: OrchestratorAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new OrchestratorAgent();
  });

  it("should create an agent successfully", () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(OrchestratorAgent);
  });

  it("should route to knowledge agent for information queries", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({ agentType: "knowledgeAgent" }),
    });

    const message: ChatMessage = {
      role: "user",
      content: "What are your business hours?",
    };

    const result = await agent.getAgentType(message);

    expect(result).toBe(AgentType.knowledgeAgent);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should route to customer service agent for support queries", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({ agentType: "csAgent" }),
    });

    const message: ChatMessage = {
      role: "user",
      content: "I need help with my account",
    };

    const result = await agent.getAgentType(message);

    expect(result).toBe(AgentType.csAgent);
  });

  it("should handle errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));

    const message: ChatMessage = {
      role: "user",
      content: "Test message",
    };

    await expect(agent.getAgentType(message)).rejects.toThrow("Failed to call agent");
  });
});
