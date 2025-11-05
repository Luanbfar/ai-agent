import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { Agent } from "./agent.ts";
import { csAgentInstruction } from "./prompts.ts";
import { logger } from "../utils/logger.ts";

/**
 * CustomerServiceAgent generates AI-driven responses
 * for customer support contexts using predefined behavior
 * and tone instructions.
 *
 * @example
 * ```typescript
 * const agent = new CustomerServiceAgent(client, "gpt-3.5-turbo");
 * const response = await agent.generate(chatMessages);
 * console.log(response);
 * ```
 */
export class CustomerServiceAgent extends Agent {
  /**
   * Creates a new CustomerServiceAgent.
   * @param client - The AI client responsible for API interaction.
   * @param model - The OpenAI model identifier (e.g., "gpt-3.5-turbo").
   * @param systemPrompt - Optional system prompt. Defaults to `csAgentInstruction`.
   */
  constructor(client: IAgentClient, model: string, systemPrompt = csAgentInstruction) {
    super(client, model, systemPrompt);
    logger.info("CustomerServiceAgent initialized", { model });
  }

  /**
   * Generates a contextual response from prior chat messages.
   * @param chatMessages - The ordered list of user and assistant messages.
   * @returns The AI-generated response string.
   */
  async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      logger.info("Generating customer service response", { messageCount: chatMessages.length });

      const result = await this.client.generateResponse(this.model, this.systemPrompt, chatMessages);

      logger.info("Customer service response generated", { responseLength: result.response?.length });
      return result.response;
    } catch (error: any) {
      logger.error("Error generating customer service response", { error: error.message, stack: error.stack });
      throw new Error("Failed to generate response");
    }
  }
}
