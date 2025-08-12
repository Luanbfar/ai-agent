import client from "../database/redis";
import { ChatMessage, IChatMemoryRepository } from "../interfaces/IChatMemoryRepository";

export class RedisChatMemory implements IChatMemoryRepository {
  private readonly CHAT_MEMORY_LIMIT = 50;
  private redisClient: typeof client;

  constructor(redisClient = client) {
    this.redisClient = redisClient;
  }

  private getKey(userId: string): string {
    return `chat:memory:${userId}`;
  }

  async appendMessage(userId: string, message: ChatMessage): Promise<void> {
    const key = this.getKey(userId);
    await this.redisClient.rPush(key, JSON.stringify(message));
    await this.redisClient.lTrim(key, -this.CHAT_MEMORY_LIMIT, -1);
    await this.redisClient.expire(key, 60 * 60 * 24 * 7);
  }

  async getConversation(userId: string, limit: number = this.CHAT_MEMORY_LIMIT): Promise<ChatMessage[]> {
    const key = this.getKey(userId);
    const messages = await this.redisClient.lRange(key, -limit, -1);
    return messages.map((msg) => JSON.parse(msg));
  }

  async clearConversation(userId: string): Promise<void> {
    const key = this.getKey(userId);
    await this.redisClient.del(key);
  }
}
