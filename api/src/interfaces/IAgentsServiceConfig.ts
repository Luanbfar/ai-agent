import { OpenAIModels } from "../types/OpenAIModels.ts";
import type { IChatMemoryRepository } from "./IChatMemoryRepository.ts";

/**
 * Configuration interface for AgentsService initialization
 */
export interface IAgentsServiceConfig {
  chatMemoryRepo: IChatMemoryRepository;
  defaultModel: OpenAIModels;
}
