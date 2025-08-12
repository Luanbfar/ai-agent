import client from "../database/redis";
import { ChatMessage, IChatMemoryRepository } from "../interfaces/IChatMemoryRepository";

/**
 * Redis-based implementation of chat memory repository.
 * Stores and retrieves chat messages per user session in Redis lists.
 */
export class RedisChatMemory implements IChatMemoryRepository {
  private readonly CHAT_MEMORY_LIMIT = 50;
  private redisClient: typeof client;

  /**
   * Creates an instance of RedisChatMemory.
   * @param redisClient - Optional Redis client instance, defaults to imported client.
   */
  constructor(redisClient = client) {
    this.redisClient = redisClient;
  }

  /**
   * Generates the Redis key for storing chat history by session ID.
   * @param sessionId - Unique session identifier.
   * @returns Redis key string.
   */
  private getKey(sessionId: string): string {
    return `chat:memory:${sessionId}`;
  }

  /**
   * Appends a chat message to the Redis list for the given session.
   * Keeps the list trimmed to the configured memory limit and sets expiration.
   * @param sessionId - Unique session identifier.
   * @param message - Chat message to append.
   */
  async appendMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const key = this.getKey(sessionId);
    await this.redisClient.rPush(key, JSON.stringify(message));
    await this.redisClient.lTrim(key, -this.CHAT_MEMORY_LIMIT, -1);
    await this.redisClient.expire(key, 60 * 60 * 24 * 7); // Expire after 7 days
  }

  /**
   * Retrieves the most recent chat messages for a given session.
   * @param sessionId - Unique session identifier.
   * @param limit - Maximum number of messages to retrieve (default 50).
   * @returns Array of chat messages in order from oldest to newest.
   */
  async getConversation(sessionId: string, limit: number = this.CHAT_MEMORY_LIMIT): Promise<ChatMessage[]> {
    const key = this.getKey(sessionId);
    const messages = await this.redisClient.lRange(key, -limit, -1);
    return messages.map((msg) => JSON.parse(msg));
  }

  /**
   * Clears the entire chat history for the specified session.
   * @param sessionId - Unique session identifier.
   */
  async clearConversation(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId);
    await this.redisClient.del(key);
  }
}
