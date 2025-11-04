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

/**
 * AgentsService orchestrates multiple AI agents to handle user queries.
 *
 * Flow:
 * 1. User query → Orchestrator Agent (determines agent type)
 * 2. Route to specialized agent (Knowledge/Customer Service)
 * 3. Generate response with context (RAG for knowledge queries)
 * 4. Enhance response personality
 * 5. Persist conversation to memory
 *
 * @example
 * ```typescript
 * const service = new AgentsService();
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

  constructor(config: IAgentsServiceConfig, client: IAgentClient) {
    // Initialize dependencies
    this.ticketService = new TicketService();
    this.chatMemoryRepo = config.chatMemoryRepo || new RedisChatMemory();
    this.client = client;

    // Initialize agents with default or custom model
    const defaultModel = config.defaultModel;
    this.orchestratorAgent = new OrchestratorAgent(client, OpenAIModels.GPT35Turbo);
    this.personalityAgent = new PersonalityAgent(client, OpenAIModels.GPT35Turbo);

    // Initialize specialized agents
    this.agentsMap = this.initializeAgents(defaultModel);
  }

  /**
   * Initialize the available agents map
   */
  private initializeAgents(model: string): Record<AgentType, Agent> {
    return {
      knowledgeAgent: new KnowledgeAgent(this.client, model),
      csAgent: new CustomerServiceAgent(this.client, model),
    };
  }

  /**
   * Main entry point for handling user queries
   *
   * @param inputData - User input containing message and optional userId
   * @returns Promise with userId and generated response
   */
  async handleUserQuery(inputData: InputData) {
    try {
      const userId = await this.resolveuserId(inputData.userId);
      const chatHistory = await this.getChatHistory(userId);

      // Route query to appropriate agent
      const agentType = await this.orchestratorAgent.getAgentType(inputData.chatMessage);
      const response = await this.generateResponse(agentType, chatHistory, inputData.chatMessage);

      // Checks if there's ticket data to be added
      const ticket = await this.ticketService.handleTicketCreation(response);

      if (ticket === null) {
        // Enhance response with personality
        // const enhancedResponse = await this.enhancePersonality(inputData.chatMessage, response);

        // Persist conversation
        await this.saveConversation(userId, inputData.chatMessage, response);

        return { userId, response: response };
      }
      const ticketResponse = ticket.response;
      return { userId, ticketResponse };
    } catch (error) {
      console.error("AgentsService.handleUserQuery:", error);
      throw new Error("Error processing the user's request.");
    }
  }

  /**
   * Resolve or generate user ID for session management
   */
  private async resolveuserId(userId?: string): Promise<string> {
    return userId && userId.trim().length > 0 ? userId : uuidv4();
  }

  /**
   * Retrieve chat history for session
   */
  private async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      return await this.chatMemoryRepo.getConversation(userId);
    } catch (error) {
      console.error("Failed to retrieve chat history:", error);
      return []; // Graceful degradation
    }
  }

  /**
   * Generate response using the appropriate agent
   */
  private async generateResponse(
    agentType: AgentType,
    chatHistory: ChatMessage[],
    currentMessage: ChatMessage
  ): Promise<string> {
    const agent = this.agentsMap[agentType];
    if (!agent) {
      throw new Error(`No agent found for type: ${agentType}`);
    }

    const fullChatHistory = [...chatHistory, currentMessage];
    return await agent.generate(fullChatHistory);
  }

  /**
   * Enhance response with personality agent
   */
  private async enhancePersonality(userMessage: ChatMessage, rawResponse: string): Promise<string> {
    try {
      const conversationContext: ChatMessage[] = [userMessage, { role: "assistant", content: rawResponse }];
      return await this.personalityAgent.generate(conversationContext);
    } catch (error) {
      console.error("Personality enhancement failed, using raw response:", error);
      return rawResponse; // Graceful fallback
    }
  }

  /**
   * Save conversation to memory
   */
  private async saveConversation(userId: string, userMessage: ChatMessage, assistantResponse: string): Promise<void> {
    try {
      await this.chatMemoryRepo.appendMessage(userId, userMessage);
      await this.chatMemoryRepo.appendMessage(userId, {
        role: "assistant",
        content: assistantResponse,
      });
    } catch (error) {
      console.error("Failed to save conversation:", error);
      // Non-blocking - conversation continues even if persistence fails
    }
  }

  /**
   * Get available agent types
   */
  public getAvailableAgents(): AgentType[] {
    return Object.keys(this.agentsMap) as AgentType[];
  }

  /**
   * Clear conversation history for a session
   */
  public async clearUserHistory(userId: string): Promise<void> {
    await this.chatMemoryRepo.clearConversation(userId);
  }
}
