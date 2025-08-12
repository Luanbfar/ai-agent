/**
 * Represents a single chat message in the conversation.
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: "user" | "assistant" | "system";

  /** Content of the message */
  content: string;
}

/**
 * Repository interface for storing and retrieving chat conversations by session ID.
 */
export interface IChatMemoryRepository {
  /**
   * Append a message to the chat history for the given session.
   * @param sessionId - Unique identifier for the chat session.
   * @param message - Chat message to append.
   */
  appendMessage(sessionId: string, message: ChatMessage): Promise<void>;

  /**
   * Retrieve chat history messages for the given session.
   * @param sessionId - Unique identifier for the chat session.
   * @param limit - Optional maximum number of messages to retrieve.
   * @returns Array of ChatMessages ordered from oldest to newest.
   */
  getConversation(sessionId: string, limit?: number): Promise<ChatMessage[]>;

  /**
   * Clear the chat history for the given session.
   * @param sessionId - Unique identifier for the chat session.
   */
  clearConversation(sessionId: string): Promise<void>;
}
