import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";
import { Agent } from "./agent.ts";
import { personalityAgentInstruction } from "./prompts.ts";

/**
 * PersonalityAgent applies a persona to the AI-generated responses,
 * modifying input text to fit a defined personality style.
 */
export class PersonalityAgent extends Agent {
  /**
   * Creates an instance of PersonalityAgent.
   * @param model - Optional OpenAI model to use.
   * @param systemPrompt - Optional system prompt, defaults to personalityAgentInstruction.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = personalityAgentInstruction) {
    super(client, model, systemPrompt);
  }

  /**
   * Generates a personality-aligned response based on an array of chat messages.
   * @param chatMessages - Array of chat messages to modify.
   * @returns A Promise resolving to the personality-styled output string.
   */
  override async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      const result = await this.client.generateResponse(this.systemPrompt, chatMessages);

      return result.response;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
