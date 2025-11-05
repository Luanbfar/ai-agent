import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { Agent } from "./agent.ts";
import { personalityAgentInstruction } from "./prompts.ts";
import { logger } from "../utils/logger.ts";

/**
 * PersonalityAgent adjusts AI responses to match a specific persona or communication style.
 * It refines existing assistant outputs to align with a desired tone or character profile.
 *
 * @example
 * ```typescript
 * const agent = new PersonalityAgent(client, "gpt-3.5-turbo");
 * const response = await agent.generate(chatMessages);
 * console.log(response);
 * ```
 */
export class PersonalityAgent extends Agent {
  /**
   * Creates a PersonalityAgent instance.
   * @param client - The AI client responsible for API communication.
   * @param model - The OpenAI model identifier (e.g., "gpt-3.5-turbo").
   * @param systemPrompt - Optional system prompt. Defaults to `personalityAgentInstruction`.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = personalityAgentInstruction) {
    super(client, model, systemPrompt);
    logger.info("PersonalityAgent initialized", { model });
  }

  /**
   * Enhances an existing conversation with personality alignment.
   * Typically called after another agent generates a response.
   *
   * @param chatMessages - The list of chat messages (including original and assistant response).
   * @returns The personality-adjusted response string.
   */
  override async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      logger.info("PersonalityAgent generating enhanced response", { messageCount: chatMessages.length });

      const result = await this.client.generateResponse(this.model, this.systemPrompt, chatMessages);

      logger.info("Personality-enhanced response generated", { responseLength: result.response?.length });
      return result.response;
    } catch (error: any) {
      logger.error("Error generating personality-enhanced response", { error: error.message, stack: error.stack });
      throw new Error("Failed to generate personality-enhanced response.");
    }
  }
}
