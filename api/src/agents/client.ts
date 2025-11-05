import OpenAI from "openai";
import type { IAgentClient } from "../interfaces/IAgentClient.ts";

export class AgentClient implements IAgentClient {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey: apiKey });
  }

  async generateResponse(model: string, instructions: string, input: any): Promise<{ response: string }> {
    const response = await this.client.responses.create({
      model,
      instructions,
      input,
    });
    return { response: response.output_text };
  }
}
