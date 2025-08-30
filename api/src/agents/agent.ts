import OpenAI from "openai";
import { openaiApiKey } from '../config/loadEnv.ts';
import { OpenAIModels } from '../types/OpenAIModels.ts';
import type { ChatMessage } from '../interfaces/IChatMemoryRepository.ts';

/**
 * Abstract base class representing a generic AI agent using OpenAI.
 * 
 * Agents extending this class must implement the generate method,
 * which accepts either a single ChatMessage or an array of ChatMessages,
 * and returns a generated string response.
 */
export abstract class Agent {
  protected client: OpenAI;
  protected systemPrompt: string;
  protected model: OpenAIModels;

  /**
   * Creates an instance of Agent.
   * @param model - OpenAI model to use (default is GPT5_NANO).
   * @param systemPrompt - System prompt to guide the model’s behavior.
   */
  constructor(model: OpenAIModels = OpenAIModels.GPT5_NANO, systemPrompt: string) {
    this.client = new OpenAI({ apiKey: openaiApiKey });
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Abstract method to generate a response given a chat message or messages,
   * optionally with additional context.
   * 
   * @param chatMessage - A single ChatMessage or array of ChatMessages.
   * @param context - Optional additional context string.
   * @returns A Promise resolving to a string response.
   */
  abstract generate(chatMessage: ChatMessage | ChatMessage[], context?: string): Promise<string>;
}
