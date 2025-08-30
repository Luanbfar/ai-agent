import type { ChatMessage } from '../interfaces/IChatMemoryRepository.ts';
import { OpenAIModels } from '../types/OpenAIModels.ts';
import { Agent } from './agent.ts';
import { csAgentInstruction } from './prompts.ts';

/**
 * CustomerServiceAgent uses OpenAI to generate responses tailored
 * for customer support scenarios based on provided chat messages.
 */
export class CustomerServiceAgent extends Agent {
  /**
   * Creates a CustomerServiceAgent instance.
   * @param model - Optional OpenAI model to use.
   * @param systemPrompt - Optional system prompt, defaults to csAgentInstruction.
   */
  constructor(model?: OpenAIModels, systemPrompt = csAgentInstruction) {
    super(model, systemPrompt);
  }

  /**
   * Generates a response based on an array of chat messages.
   * @param chatMessages - Array of chat messages to generate a response for.
   * @returns A Promise resolving to the response string.
   */
  async generate(chatMessages: ChatMessage[]): Promise<string> {
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
