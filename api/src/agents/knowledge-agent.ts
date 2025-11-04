import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { DocumentRetriever } from "../rag/retriever.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";
import { Agent } from "./agent.ts";
import { knowledgeAgentInstruction } from "./prompts.ts";

/**
 * KnowledgeAgent extends Agent and integrates a RAG pipeline
 * to provide knowledge-augmented responses based on retrieved context.
 */
export class KnowledgeAgent extends Agent {
  private retriever: DocumentRetriever;

  /**
   * Creates an instance of KnowledgeAgent.
   * @param model - Optional OpenAI model to use.
   * @param systemPrompt - Optional system prompt, defaults to knowledgeAgentInstruction.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = knowledgeAgentInstruction) {
    super(client, model, systemPrompt);
    this.retriever = new DocumentRetriever();
  }

  /**
   * Generates a response using chat messages and augmented
   * with retrieved document context.
   * @param chatMessages - Array of chat messages to process.
   * @returns A Promise resolving to the generated response string.
   */
  async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      const messagesContent = chatMessages.map((message) => message.content);
      const lastMessage = messagesContent[messagesContent.length - 1] as string;

      // Retrieve relevant documents based on last message
      const docs = await this.retriever.retrieve(lastMessage);

      // Concatenate the retrieved documents content into one string
      const docsContent = docs.context.map((doc) => doc.pageContent).join("\n");

      // Prepend retrieved context as a system message
      const augmentedMessages = [{ role: "system", content: docsContent }, ...chatMessages] as ChatMessage[];

      const result = await this.client.generateResponse(this.systemPrompt, augmentedMessages);

      return result.response;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
