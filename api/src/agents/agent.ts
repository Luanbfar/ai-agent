import OpenAI from "openai";
import { openaiApiKey } from "../config/loadEnv";

export abstract class Agent {
  protected client: OpenAI;
  protected systemPrompt: string;
  protected model: string;

  constructor(model: string = "gpt-5-nano", systemPrompt: string) {
    this.client = new OpenAI({ apiKey: openaiApiKey });
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  abstract generate(prompt: string, context?: string): Promise<string>;
}
