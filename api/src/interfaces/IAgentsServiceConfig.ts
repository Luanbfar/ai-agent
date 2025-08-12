import { OpenAIModels } from "../types/OpenAIModels";
import { IChatMemoryRepository } from "./IChatMemoryRepository";

/**
 * Configuration interface for AgentsService initialization
 */
export interface IAgentsServiceConfig {
  chatMemoryRepo?: IChatMemoryRepository;
  defaultModel?: OpenAIModels;
}
