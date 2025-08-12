import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PersonalityAgent } from "../../../src/agents/personality-agent";
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

describe("PersonalityAgent", () => {
  let personalityAgent: PersonalityAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    personalityAgent = new PersonalityAgent();
  });

  describe("constructor", () => {
    it("should initialize with default parameters", () => {
      expect(personalityAgent).toBeInstanceOf(PersonalityAgent);
    });

    it("should initialize with custom model and system prompt", () => {
      const customPrompt = "Custom personality prompt";
      const customAgent = new PersonalityAgent(OpenAIModels.GPT4, customPrompt);
      expect(customAgent).toBeInstanceOf(PersonalityAgent);
    });
  });

  describe("generate", () => {
    it("should enhance response with InfinitePay personality", async () => {
      mockCreate.mockResolvedValue({
        output_text:
          "At InfinitePay, we provide comprehensive payment solutions to help your business grow. Our services include payment processing, digital accounts, and business loans.",
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "What services do you offer?" },
        { role: "assistant", content: "We offer payment processing, accounts, and loans." },
      ];

      const result = await personalityAgent.generate(chatMessages);

      expect(result).toBe(
        "At InfinitePay, we provide comprehensive payment solutions to help your business grow. Our services include payment processing, digital accounts, and business loans."
      );
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("customer support agent for InfinitePay"),
        input: chatMessages,
      });
    });

    it("should maintain professional tone in personality enhancement", async () => {
      mockCreate.mockResolvedValue({
        output_text:
          "I understand your concern about the payment delay. Let me assist you with resolving this issue promptly.",
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "My payment is delayed" },
        { role: "assistant", content: "Payment delay issue detected." },
      ];

      const result = await personalityAgent.generate(chatMessages);

      expect(result).toBe(
        "I understand your concern about the payment delay. Let me assist you with resolving this issue promptly."
      );
      expect(mockCreate).toHaveBeenCalledWith({
        model: OpenAIModels.GPT5_NANO,
        instructions: expect.stringContaining("helpful, respectful, and professional"),
        input: chatMessages,
      });
    });

    it("should handle complex conversation context", async () => {
      mockCreate.mockResolvedValue({
        output_text:
          "Thank you for providing those details. Based on your account information, I can see the issue and will help you resolve it immediately.",
      });

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "I need help with my account" },
        { role: "assistant", content: "What specific help do you need?" },
        { role: "user", content: "Payment processing is not working" },
        { role: "assistant", content: "Can you provide your account details?" },
        { role: "user", content: "My account ID is 12345" },
        { role: "assistant", content: "Account found. Issue identified. Will fix." },
      ];

      const result = await personalityAgent.generate(chatMessages);

      expect(result).toBe(
        "Thank you for providing those details. Based on your account information, I can see the issue and will help you resolve it immediately."
      );
    });

    it("should handle single message context", async () => {
      mockCreate.mockResolvedValue({
        output_text: "Welcome to InfinitePay! I'm here to help you with any questions or concerns you may have.",
      });

      const chatMessages: ChatMessage[] = [{ role: "assistant", content: "Hello" }];

      const result = await personalityAgent.generate(chatMessages);

      expect(result).toBe("Welcome to InfinitePay! I'm here to help you with any questions or concerns you may have.");
    });

    it("should throw error when OpenAI call fails", async () => {
      mockCreate.mockRejectedValue(new Error("OpenAI API error"));

      const chatMessages: ChatMessage[] = [
        { role: "user", content: "Test message" },
        { role: "assistant", content: "Test response" },
      ];

      await expect(personalityAgent.generate(chatMessages)).rejects.toThrow("Failed to generate response");
    });

    it("should handle empty chat messages array", async () => {
      mockCreate.mockResolvedValue({
        output_text: "Hello! How can InfinitePay assist you today?",
      });

      const chatMessages: ChatMessage[] = [];

      const result = await personalityAgent.generate(chatMessages);

      expect(result).toBe("Hello! How can InfinitePay assist you today?");
    });
  });
});
