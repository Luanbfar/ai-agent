import type { ChatMessage } from "./IChatMemoryRepository.ts";

export interface IAgentClient {
  readonly model: string;
  generateResponse(instructions: string, input: ChatMessage[]): Promise<{ response: string }>;
}
