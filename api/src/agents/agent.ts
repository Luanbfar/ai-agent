import OpenAI from "openai";
import { openaiApiKey } from "../config/loadEnv";
import { OpenAIModels } from "../types/OpenAIModels";
import { ChatMessage } from "../interfaces/IChatMemoryRepository";

export abstract class Agent {
  protected client: OpenAI;
  protected systemPrompt: string;
  protected model: OpenAIModels;

  constructor(model: OpenAIModels = OpenAIModels.GPT5_NANO, systemPrompt: string) {
    this.client = new OpenAI({ apiKey: openaiApiKey });
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  abstract generate(chatMessage: ChatMessage | ChatMessage[], context?: string): Promise<string>;
}
