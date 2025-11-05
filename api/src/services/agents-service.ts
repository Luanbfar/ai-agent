import { Agent } from "../agents/agent.ts";
import { CustomerServiceAgent } from "../agents/cs-agent.ts";
import { KnowledgeAgent } from "../agents/knowledge-agent.ts";
import { OrchestratorAgent } from "../agents/orchestrator-agent.ts";
import { PersonalityAgent } from "../agents/personality-agent.ts";
import type { IAgentsServiceConfig } from "../interfaces/IAgentsServiceConfig.ts";
import type { ChatMessage, IChatMemoryRepository } from "../interfaces/IChatMemoryRepository.ts";
import { RedisChatMemory } from "../repositories/RedisChatMemory.ts";
import { AgentType } from "../types/AgentType.ts";
import type { InputData } from "../types/InputData.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";
import { v4 as uuidv4 } from "uuid";
import { TicketService } from "./tickets-service.ts";
import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import { MongoTicketRepository } from "../repositories/MongoTicket.ts";
import { logger } from "../utils/logger.ts";
import type { ITicketRepository } from "../interfaces/ITicketRepository.ts";

/**
 * AgentsService orchestrates multiple AI agents to handle user queries.
 *
 * ## Flow
 * 1. User query → Orchestrator Agent (determines agent type)
 * 2. Routed to specialized agent (Knowledge or Customer Service)
 * 3. Agent generates a contextual response (RAG for knowledge-based queries)
 * 4. PersonalityAgent enhances tone and style
 * 5. Conversation persisted to chat memory
 *
 * @example
 * ```typescript
 * const service = new AgentsService(config, client);
 * const response = await service.handleUserQuery({
 *   userId: 'user-123',
 *   chatMessage: { role: 'user', content: 'What are your business hours?' }
 * });
 * ```
 */
export class AgentsService {
  private readonly ticketService: TicketService;
  private readonly chatMemoryRepo: IChatMemoryRepository;
  private readonly orchestratorAgent: OrchestratorAgent;
  private readonly personalityAgent: PersonalityAgent;
  private readonly agentsMap: Record<AgentType, Agent>;
  private readonly client: IAgentClient;

  constructor(config: IAgentsServiceConfig, client: IAgentClient, ticketService: TicketService) {
    this.ticketService = ticketService;
    this.chatMemoryRepo = config.chatMemoryRepo;
    this.client = client;

    const defaultModel = config.defaultModel || OpenAIModels.GPT35Turbo;
    this.orchestratorAgent = new OrchestratorAgent(client, OpenAIModels.GPT35Turbo);
    this.personalityAgent = new PersonalityAgent(client, OpenAIModels.GPT35Turbo);

    this.agentsMap = this.initializeAgents(defaultModel);
    logger.info("AgentsService initialized", { defaultModel });
  }

  /**
   * Initializes all specialized agents.
   */
  private initializeAgents(model: string): Record<AgentType, Agent> {
    return {
      knowledgeAgent: new KnowledgeAgent(this.client, model),
      csAgent: new CustomerServiceAgent(this.client, model),
    };
  }

  /**
   * Main entry point for handling user messages.
   * Determines agent type, routes query, enhances response, and persists memory.
   *
   * @param inputData - User input containing message and optional userId
   * @returns Object with userId and generated response
   */
  async handleUserQuery(inputData: InputData) {
    try {
      const userId = await this.resolveUserId(inputData.userId);
      const chatHistory = await this.getChatHistory(userId);

      const agentType = await this.orchestratorAgent.getAgentType(inputData.chatMessage);
      logger.info("Orchestrator selected agent", { agentType });

      const response = await this.generateResponse(agentType, chatHistory, inputData.chatMessage);

      const ticket = await this.ticketService.handleTicketCreation(response);
      if (ticket) {
        logger.info("Ticket created successfully", { userId, ticket });
        return { userId, response: ticket.response };
      }

      const enhancedResponse = await this.enhancePersonality(inputData.chatMessage, response);
      await this.saveConversation(userId, inputData.chatMessage, enhancedResponse);

      return { userId, response: enhancedResponse };
    } catch (error: any) {
      logger.error("Error in handleUserQuery", { error: error.message, stack: error.stack });
      throw new Error("Error processing the user's request.");
    }
  }

  /**
   * Resolves or generates a unique user ID.
   */
  private async resolveUserId(userId?: string): Promise<string> {
    const resolvedId = userId && userId.trim().length > 0 ? userId : uuidv4();
    logger.info("Resolved user ID", { userId: resolvedId });
    return resolvedId;
  }

  /**
   * Retrieves conversation history from memory.
   */
  private async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      const history = await this.chatMemoryRepo.getConversation(userId);
      logger.info("Chat history retrieved", { userId, messageCount: history.length });
      return history;
    } catch (error: any) {
      logger.error("Failed to retrieve chat history", { userId, error: error.message });
      return [];
    }
  }

  /**
   * Routes query to the correct agent and generates a response.
   */
  private async generateResponse(
    agentType: AgentType,
    chatHistory: ChatMessage[],
    currentMessage: ChatMessage
  ): Promise<string> {
    const agent = this.agentsMap[agentType];
    if (!agent) throw new Error(`No agent found for type: ${agentType}`);

    const fullChatHistory = [...chatHistory, currentMessage];
    const response = await agent.generate(fullChatHistory);
    logger.info("Generated response", { agentType, responseLength: response.length });
    return response;
  }

  /**
   * Enhances the response tone and personality using the PersonalityAgent.
   */
  private async enhancePersonality(userMessage: ChatMessage, rawResponse: string): Promise<string> {
    try {
      const context: ChatMessage[] = [userMessage, { role: "assistant", content: rawResponse }];
      const enhanced = await this.personalityAgent.generate(context);
      logger.info("Response enhanced with personality");
      return enhanced;
    } catch (error: any) {
      logger.warning("Personality enhancement failed, using raw response", { error: error.message });
      return rawResponse;
    }
  }

  /**
   * Persists user and assistant messages into memory.
   */
  private async saveConversation(userId: string, userMessage: ChatMessage, assistantResponse: string): Promise<void> {
    try {
      await this.chatMemoryRepo.appendMessage(userId, userMessage);
      await this.chatMemoryRepo.appendMessage(userId, { role: "assistant", content: assistantResponse });
      logger.info("Conversation saved", { userId });
    } catch (error: any) {
      logger.error("Failed to save conversation", { userId, error: error.message });
    }
  }

  /**
   * Returns all available agent types.
   */
  public getAvailableAgents(): AgentType[] {
    return Object.keys(this.agentsMap) as AgentType[];
  }

  /**
   * Clears conversation history for a given user.
   */
  public async clearUserHistory(userId: string): Promise<void> {
    await this.chatMemoryRepo.clearConversation(userId);
    logger.info("User conversation history cleared", { userId });
  }
}
