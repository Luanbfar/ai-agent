export interface IChatMemoryRepository {
  appendMessage(userId: string, message: ChatMessage): Promise<void>;
  getConversation(userId: string, limit?: number): Promise<ChatMessage[]>;
  clearConversation(userId: string): Promise<void>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
