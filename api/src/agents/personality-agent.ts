import { ChatMessage } from "../interfaces/IChatMemoryRepository";
import { OpenAIModels } from "../types/OpenAIModels";
import { Agent } from "./agent";
import { personalityAgentInstruction } from "./prompts";

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
  constructor(model?: OpenAIModels, systemPrompt: string = personalityAgentInstruction) {
    super(model, systemPrompt);
  }

  /**
   * Generates a personality-aligned response based on an array of chat messages.
   * @param chatMessages - Array of chat messages to modify.
   * @returns A Promise resolving to the personality-styled output string.
   */
  override async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: chatMessages,
      });

      return response.output_text;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
