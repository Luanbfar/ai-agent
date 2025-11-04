import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { AgentType } from "../types/AgentType.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";
import { Agent } from "./agent.ts";
import { orchestratorInstruction } from "./prompts.ts";

/**
 * OrchestratorAgent decides which agent type should handle a
 * given user message by classifying the intent via OpenAI.
 */
export class OrchestratorAgent extends Agent {
  /**
   * Creates an instance of OrchestratorAgent.
   * @param model - Optional OpenAI model to use.
   * @param systemPrompt - Optional system prompt, defaults to orchestratorInstruction.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = orchestratorInstruction) {
    super(client, model, systemPrompt);
  }

  /**
   * Generates a classification response from a single chat message.
   * @param chatMessage - Single chat message to classify.
   * @returns A Promise resolving to a parsed object from the model’s output.
   */
  override async generate(chatMessage: ChatMessage): Promise<any> {
    try {
      const result = await this.client.generateResponse(this.systemPrompt, [
        { role: chatMessage.role, content: chatMessage.content },
      ]);
      const rawResponse = result.response;
      const response = JSON.parse(rawResponse);
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }

  /**
   * Classifies the agent type for a given chat message.
   * @param chatMessage - Single chat message to classify.
   * @returns A Promise resolving to an AgentType enum value.
   */
  async getAgentType(chatMessage: ChatMessage): Promise<AgentType> {
    try {
      const result = await this.generate(chatMessage);
      const agentType: AgentType = result.agentType as AgentType;
      return agentType;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to call agent");
    }
  }
}
