import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { AgentType } from "../types/AgentType.ts";
import { Agent } from "./agent.ts";
import { orchestratorInstruction } from "./prompts.ts";
import { logger } from "../utils/logger.ts";

/**
 * OrchestratorAgent determines which specialized agent
 * (e.g., KnowledgeAgent, CustomerServiceAgent) should handle a given message.
 * It classifies user intent using an OpenAI model.
 *
 * @example
 * ```typescript
 * const orchestrator = new OrchestratorAgent(client, "gpt-3.5-turbo");
 * const agentType = await orchestrator.getAgentType({ role: "user", content: "I need help with my order" });
 * console.log(agentType); // -> "csAgent"
 * ```
 */
export class OrchestratorAgent extends Agent {
  /**
   * Creates an OrchestratorAgent instance.
   * @param client - The AI client responsible for communication with the model.
   * @param model - The OpenAI model identifier (e.g., "gpt-3.5-turbo").
   * @param systemPrompt - Optional system prompt. Defaults to `orchestratorInstruction`.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = orchestratorInstruction) {
    super(client, model, systemPrompt);
    logger.info("OrchestratorAgent initialized", { model });
  }

  /**
   * Uses the model to classify a user message and determine intent.
   * The model must return a JSON string with an `agentType` field.
   *
   * @param chatMessage - The chat message to analyze.
   * @returns A parsed object representing the model's classification result.
   */
  override async generate(chatMessage: ChatMessage): Promise<any> {
    try {
      logger.info("OrchestratorAgent generating classification", {
        contentSnippet: chatMessage.content.slice(0, 100),
      });

      const result = await this.client.generateResponse(this.model, this.systemPrompt, [
        { role: chatMessage.role, content: chatMessage.content },
      ]);

      const rawResponse = result.response;
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError: any) {
        logger.error("Failed to parse model response", { rawResponse });
        throw new Error("Model returned invalid JSON.");
      }

      logger.info("Classification generated successfully", { parsedResponse });
      return parsedResponse;
    } catch (error: any) {
      logger.error("Error generating orchestrator response", { error: error.message, stack: error.stack });
      throw new Error("Failed to generate classification response.");
    }
  }

  /**
   * Determines which agent should handle the user's query
   * based on the model's classification output.
   *
   * @param chatMessage - The chat message to classify.
   * @returns The detected AgentType.
   */
  async getAgentType(chatMessage: ChatMessage): Promise<AgentType> {
    try {
      const result = await this.generate(chatMessage);

      const agentType = result.agentType as AgentType;
      if (!Object.values(AgentType).includes(agentType)) {
        logger.warning("Invalid agent type returned by model", { result });
        throw new Error("Unrecognized agent type from model.");
      }

      logger.info("Orchestrator selected agent type", { agentType });
      return agentType;
    } catch (error: any) {
      logger.error("Failed to get agent type", { error: error.message, stack: error.stack });
      throw new Error("Failed to determine appropriate agent.");
    }
  }
}
