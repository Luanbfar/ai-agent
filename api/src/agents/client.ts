import OpenAI from "openai";
import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import { OpenAIModels } from "../types/OpenAIModels.js";

export class AgentClient implements IAgentClient {
  private readonly client: OpenAI;
  private readonly apiKey: string;
  readonly model: OpenAIModels;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey: this.apiKey });
    this.model = OpenAIModels.GPT5_NANO;
  }

  async generateResponse(instructions: string, input: any): Promise<{ response: string }> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions,
      input,
    });
    return { response: response.output_text };
  }
}
