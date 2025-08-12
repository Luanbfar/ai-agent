import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OrchestratorAgent } from "../../../src/agents/orchestrator-agent";
import { AgentType } from "../../../src/types/AgentType";
import { OpenAIModels } from "../../../src/types/OpenAIModels";
import { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository";

// Mock OpenAI client
const mockCreate = jest.fn((...args: any[]) => Promise.resolve({ output_text: "" }));
jest.unstable_mockModule("openai", () => ({
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: mockCreate,
    },
  })),
}));

describe("OrchestratorAgent", () => {
  let orchestratorAgent: OrchestratorAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestratorAgent = new OrchestratorAgent();
  });

  describe("constructor", () => {
    it("should initialize with default parameters", () => {
      expect(orchestratorAgent).toBeInstanceOf(OrchestratorAgent);
    });

    it("should initialize with custom model and system prompt", () => {
      const customPrompt = "Custom orchestrator prompt";
      const customAgent = new OrchestratorAgent(OpenAIModels.GPT4, customPrompt);
      expect(customAgent).toBeInstanceOf(OrchestratorAgent);
    });
  });

  describe("generate", () => {
    it("should return parsed JSON response from OpenAI", async () => {
      const mockResponse = {
        output_text: JSON.stringify({ agentType: "knowledgeAgent" }),
      };
      mockCreate.mockResolvedValue(mockResponse);

      const chatMessage: ChatMessage = {
        role: "user",
        content: "What are your business hours?",
      };

      const result = await orchestratorAgent.generate(chatMessage);

      expect(result).toEqual({ agentType: "knowledgeAgent" });
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("AI agents orchestrator"),
        input: [{ role: "user", content: "What are your business hours?" }],
      });
    });

    it("should throw error when OpenAI call fails", async () => {
      mockCreate.mockRejectedValue(new Error("OpenAI API error"));

      const chatMessage: ChatMessage = {
        role: "user",
        content: "Test message",
      };

      await expect(orchestratorAgent.generate(chatMessage)).rejects.toThrow("Failed to generate response");
    });

    it("should throw error when response is invalid JSON", async () => {
      const mockResponse = {
        output_text: "invalid json response",
      };
      mockCreate.mockResolvedValue(mockResponse);

      const chatMessage: ChatMessage = {
        role: "user",
        content: "Test message",
      };

      await expect(orchestratorAgent.generate(chatMessage)).rejects.toThrow("Failed to generate response");
    });
  });

  describe("getAgentType", () => {
    it("should return knowledgeAgent for knowledge-related query", async () => {
      const mockResponse = {
        output_text: JSON.stringify({ agentType: "knowledgeAgent" }),
      };
      mockCreate.mockResolvedValue(mockResponse);

      const chatMessage: ChatMessage = {
        role: "user",
        content: "What services do you offer?",
      };

      const result = await orchestratorAgent.getAgentType(chatMessage);
      expect(result).toBe(AgentType.knowledgeAgent);
    });

    it("should return csAgent for customer service query", async () => {
      const mockResponse = {
        output_text: JSON.stringify({ agentType: "csAgent" }),
      };
      mockCreate.mockResolvedValue(mockResponse);

      const chatMessage: ChatMessage = {
        role: "user",
        content: "I need help with my account",
      };

      const result = await orchestratorAgent.getAgentType(chatMessage);
      expect(result).toBe(AgentType.csAgent);
    });

    it("should throw error when agent classification fails", async () => {
      mockCreate.mockRejectedValue(new Error("Classification failed"));

      const chatMessage: ChatMessage = {
        role: "user",
        content: "Test message",
      };

      await expect(orchestratorAgent.getAgentType(chatMessage)).rejects.toThrow("Failed to call agent");
    });
  });
});
