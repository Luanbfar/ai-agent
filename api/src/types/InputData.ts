import type { ChatMessage } from '../interfaces/IChatMemoryRepository.ts';

export type InputData = {
  userId: string;
  chatMessage: ChatMessage;
};
