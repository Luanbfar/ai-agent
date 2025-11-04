import type { ChatMessage } from "./IChatMemoryRepository.ts";

export interface IAgentClient {
  generateResponse(model: string, instructions: string, input: ChatMessage[]): Promise<{ response: string }>;
}
