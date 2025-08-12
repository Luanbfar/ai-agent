import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { KnowledgeAgent } from "../../../src/agents/knowledge-agent";
import { ChatMessage } from "../../../src/interfaces/IChatMemoryRepository";
import { OpenAIModels } from "../../../src/types/OpenAIModels";

// Mock OpenAI client
const mockCreate = jest.fn((...args: any[]) => Promise.resolve({ output_text: "" }));
jest.unstable_mockModule("openai", () => ({
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: mockCreate,
    },
  })),
}));

// Mock DocumentRetriever
const mockRetrieve = jest.fn((...args: any[]) => Promise.resolve({ context: [{ pageContent: "some content" }] }));
jest.unstable_mockModule("../../../src/rag/retriever", () => ({
  DocumentRetriever: jest.fn().mockImplementation(() => ({
    retrieve: mockRetrieve,
  })),
}));

describe("KnowledgeAgent", () => {
  let knowledgeAgent: KnowledgeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    knowledgeAgent = new KnowledgeAgent();
  });

  describe("constructor", () => {
    it("should initialize with default parameters", () => {
      expect(knowledgeAgent).toBeInstanceOf(KnowledgeAgent);
    });

    it("should initialize with custom model and system prompt", () => {
      const customPrompt = "Custom knowledge prompt";
      const customAgent = new KnowledgeAgent(OpenAIModels.GPT4, customPrompt);
      expect(customAgent).toBeInstanceOf(KnowledgeAgent);
    });
  });

  describe("generate", () => {
    it("should generate response with retrieved context", async () => {
      const mockDocs = [
        { pageContent: "InfinitePay offers payment solutions for businesses." },
        { pageContent: "Our business hours are 9 AM to 6 PM, Monday through Friday." },
      ];

      mockRetrieve.mockResolvedValue({ context: mockDocs });
      mockCreate.mockResolvedValue({
        output_text: "InfinitePay is open from 9 AM to 6 PM on weekdays.",
      });

      const chatMessages: ChatMessage[] = [{ role: "user", content: "What are your business hours?" }];

      const result = await knowledgeAgent.generate(chatMessages);

      expect(result).toBe("InfinitePay is open from 9 AM to 6 PM on weekdays.");
      expect(mockRetrieve).toHaveBeenCalledWith("What are your business hours?");

      // Verify that context was prepended to messages
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("question-answering tasks"),
        input: [
          {
            role: "system",
            content: expect.stringContaining("InfinitePay offers payment solutions"),
          },
          { role: "user", content: "What are your business hours?" },
        ],
      });
    });

    it("should handle multiple chat messages", async () => {
      const mockDocs = [{ pageContent: "InfinitePay services include payment processing." }];

      mockRetrieve.mockResolvedValue({ context: mockDocs });
      mockCreate.mockResolvedValue({
        output_text: "We offer various payment processing services.",
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi! How can I help you?" },
        { role: "user", content: "What services do you offer?" },
      ];

      const result = await knowledgeAgent.generate(chatMessages);

      expect(result).toBe("We offer various payment processing services.");
      expect(mockRetrieve).toHaveBeenCalledWith("What services do you offer?");
    });

    it("should handle empty context gracefully", async () => {
      mockRetrieve.mockResolvedValue({ context: [] });
      mockCreate.mockResolvedValue({
        output_text: "I don't have specific information about that.",
      });

      const chatMessages: ChatMessage[] = [{ role: "user", content: "Unknown query" }];

      const result = await knowledgeAgent.generate(chatMessages);

      expect(result).toBe("I don't have specific information about that.");
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("question-answering tasks"),
        input: [
          { role: "system", content: "" },
          { role: "user", content: "Unknown query" },
        ],
      });
    });

    it("should throw error when document retrieval fails", async () => {
      mockRetrieve.mockRejectedValue(new Error("Retrieval failed"));

      const chatMessages: ChatMessage[] = [{ role: "user", content: "Test query" }];

      await expect(knowledgeAgent.generate(chatMessages)).rejects.toThrow("Failed to generate response");
    });

    it("should throw error when OpenAI call fails", async () => {
      const mockDocs = [{ pageContent: "Test context" }];
      mockRetrieve.mockResolvedValue({ context: mockDocs });
      mockCreate.mockRejectedValue(new Error("OpenAI API error"));

      const chatMessages: ChatMessage[] = [{ role: "user", content: "Test query" }];

      await expect(knowledgeAgent.generate(chatMessages)).rejects.toThrow("Failed to generate response");
    });
  });
});
