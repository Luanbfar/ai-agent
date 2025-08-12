import { ChatMessage } from "../interfaces/IChatMemoryRepository";
import { OpenAIModels } from "../types/OpenAIModels";
import { Agent } from "./agent";
import { personalityAgentInstruction } from "./prompts";

export class PersonalityAgent extends Agent {
  constructor(model?: OpenAIModels, systemPrompt: string = personalityAgentInstruction) {
    super(model, systemPrompt);
  }

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
