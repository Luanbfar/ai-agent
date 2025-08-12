import { Agent } from "../agents/agent";
import { CustomerServiceAgent } from "../agents/cs-agent";
import { KnowledgeAgent } from "../agents/knowledge-agent";
import { OrchestratorAgent } from "../agents/orchestrator-agent";
import { PersonalityAgent } from "../agents/personality-agent";
import { ChatMessage, IChatMemoryRepository } from "../interfaces/IChatMemoryRepository";
import { RedisChatMemory } from "../repositories/RedisChatMemory";
import { AgentType } from "../types/AgentType";
import { InputData } from "../types/InputData";
import { v4 as uuidv4 } from "uuid";

export class AgentsService {
  private chatMemoryRepo: IChatMemoryRepository;
  private orchestratorAgent: OrchestratorAgent;
  private personalityAgent: PersonalityAgent;
  private knowledgeAgent: KnowledgeAgent;
  private csAgent: CustomerServiceAgent;
  private agentsMap: Record<AgentType, Agent>;

  constructor() {
    this.chatMemoryRepo = new RedisChatMemory();
    this.orchestratorAgent = new OrchestratorAgent();
    this.personalityAgent = new PersonalityAgent();
    this.knowledgeAgent = new KnowledgeAgent();
    this.csAgent = new CustomerServiceAgent();
    this.agentsMap = {
      knowledgeAgent: this.knowledgeAgent,
      csAgent: this.csAgent,
    };
  }

  async handleUserQuery(inputData: InputData) {
    try {
      let { userId, chatMessage } = inputData;

      let chats: ChatMessage[] = [];

      if (userId && userId.trim().length > 0) {
        chats = await this.chatMemoryRepo.getConversation(userId);
      } else {
        userId = uuidv4();
      }
      const agentType = await this.orchestratorAgent.getAgentType(chatMessage);

      const agent = this.agentsMap[agentType];
      if (!agent) throw new Error(`No agent found for type: ${agentType}`);

      const chatHistory = [...chats, chatMessage];

      const rawResponse = await agent.generate(chatHistory);

      const c: ChatMessage[] = [chatMessage, { role: "assistant", content: rawResponse }];

      const response = await this.personalityAgent.generate(c);

      await this.chatMemoryRepo.appendMessage(userId, chatMessage);
      await this.chatMemoryRepo.appendMessage(userId, { role: "assistant", content: response });

      return { userId, response };
    } catch (error) {
      console.error(error);
      throw new Error("Error processing the user's request.");
    }
  }
}
