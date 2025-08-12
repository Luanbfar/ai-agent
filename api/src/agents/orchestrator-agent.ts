import { ChatMessage } from "../interfaces/IChatMemoryRepository";
import { AgentType } from "../types/AgentType";
import { OpenAIModels } from "../types/OpenAIModels";
import { Agent } from "./agent";
import { orchestratorInstruction } from "./prompts";

export class OrchestratorAgent extends Agent {
  constructor(model?: OpenAIModels, systemPrompt: string = orchestratorInstruction) {
    super(model, systemPrompt);
  }

  override async generate(chatMessage: ChatMessage): Promise<any> {
    try {
      const rawResponse = await this.client.responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: [{ role: chatMessage.role, content: chatMessage.content }],
      });
      const response = JSON.parse(rawResponse.output_text);
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }

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
