import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CustomerServiceAgent } from "../../../src/agents/cs-agent";
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

describe("CustomerServiceAgent", () => {
  let csAgent: CustomerServiceAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    csAgent = new CustomerServiceAgent();
  });

  describe("constructor", () => {
    it("should initialize with default parameters", () => {
      expect(csAgent).toBeInstanceOf(CustomerServiceAgent);
    });

    it("should initialize with custom model and system prompt", () => {
      const customPrompt = "Custom CS prompt";
      const customAgent = new CustomerServiceAgent(OpenAIModels.GPT4, customPrompt);
      expect(customAgent).toBeInstanceOf(CustomerServiceAgent);
    });
  });

  describe("generate", () => {
    it("should generate customer service response", async () => {
      mockCreate.mockResolvedValue({
        output_text: "I can help you with your account issue. What specific problem are you experiencing?",
      });

      const chatMessages: ChatMessage[] = [{ role: "user", content: "I need help with my account" }];

      const result = await csAgent.generate(chatMessages);

      expect(result).toBe("I can help you with your account issue. What specific problem are you experiencing?");
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("Customer Support Agent for InfinitePay"),
        input: chatMessages,
      });
    });

    it("should handle ticket creation response", async () => {
      const ticketResponse = JSON.stringify({
        action: "create_ticket",
        subject: "Payment Processing Issue",
        description: "Customer experiencing delays in payment processing",
        date: "2025-08-12T18:30:00.000Z",
        status: "open",
      });

      mockCreate.mockResolvedValue({
        output_text: ticketResponse,
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "I want to create a support ticket" },
        { role: "assistant", content: "What seems to be the issue?" },
        { role: "user", content: "My payments are not processing correctly" },
      ];

      const result = await csAgent.generate(chatMessages);

      expect(result).toBe(ticketResponse);
      expect(JSON.parse(result)).toEqual({
        action: "create_ticket",
        subject: "Payment Processing Issue",
        description: "Customer experiencing delays in payment processing",
        date: "2025-08-12T18:30:00.000Z",
        status: "open",
      });
    });

    it("should handle no ticket creation response", async () => {
      const noTicketResponse = JSON.stringify({
        action: "no_ticket",
      });

      mockCreate.mockResolvedValue({
        output_text: noTicketResponse,
      });

      const chatMessages: ChatMessage[] = [{ role: "user", content: "Just wanted to ask about your services" }];

      const result = await csAgent.generate(chatMessages);

      expect(result).toBe(noTicketResponse);
      expect(JSON.parse(result)).toEqual({ action: "no_ticket" });
    });

    it("should handle multiple conversation context", async () => {
      mockCreate.mockResolvedValue({
        output_text: "I understand your concern about the payment delay. Let me check the details for you.",
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi! How can I help you today?" },
        { role: "user", content: "I have a payment issue" },
        { role: "assistant", content: "What type of payment issue are you experiencing?" },
        { role: "user", content: "My payment has been pending for 3 days" },
      ];

      const result = await csAgent.generate(chatMessages);

      expect(result).toBe("I understand your concern about the payment delay. Let me check the details for you.");
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("Customer Support Agent for InfinitePay"),
        input: chatMessages,
      });
    });

    it("should throw error when OpenAI call fails", async () => {
      mockCreate.mockRejectedValue(new Error("OpenAI API error"));

      const chatMessages: ChatMessage[] = [{ role: "user", content: "Test message" }];

      await expect(csAgent.generate(chatMessages)).rejects.toThrow("Failed to generate response");
    });

    it("should handle empty chat messages array", async () => {
      mockCreate.mockResolvedValue({
        output_text: "Hello! How can I assist you today?",
      });

      const chatMessages: ChatMessage[] = [];

      const result = await csAgent.generate(chatMessages);

      expect(result).toBe("Hello! How can I assist you today?");
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("Customer Support Agent for InfinitePay"),
        input: [],
      });
    });
  });
});
