import type { IAgentClient } from "../interfaces/IAgentClient.ts";
import type { ChatMessage } from "../interfaces/IChatMemoryRepository.ts";
import { DocumentRetriever } from "../rag/retriever.ts";
import { Agent } from "./agent.ts";
import { knowledgeAgentInstruction } from "./prompts.ts";
import { logger } from "../utils/logger.ts";

/**
 * KnowledgeAgent integrates a RAG (Retrieval-Augmented Generation) pipeline
 * to provide knowledge-grounded responses. It retrieves contextual documents
 * relevant to the user's latest message and uses them to enhance the model's output.
 *
 * @example
 * ```typescript
 * const agent = new KnowledgeAgent(client, "gpt-3.5-turbo");
 * const response = await agent.generate(chatMessages);
 * console.log(response);
 * ```
 */
export class KnowledgeAgent extends Agent {
  private readonly retriever: DocumentRetriever;

  /**
   * Creates a KnowledgeAgent instance.
   * @param client - The AI client responsible for model interaction.
   * @param model - The OpenAI model identifier (e.g., "gpt-3.5-turbo").
   * @param systemPrompt - Optional system prompt. Defaults to `knowledgeAgentInstruction`.
   */
  constructor(client: IAgentClient, model: string, systemPrompt: string = knowledgeAgentInstruction) {
    super(client, model, systemPrompt);
    this.retriever = new DocumentRetriever();
    logger.info("KnowledgeAgent initialized", { model });
  }

  /**
   * Generates a response augmented with retrieved contextual knowledge.
   * The agent performs the following steps:
   * 1. Extracts the latest user message.
   * 2. Retrieves relevant documents from the retriever.
   * 3. Prepends the document content as system context.
   * 4. Requests a completion from the model.
   *
   * @param chatMessages - The ordered chat history.
   * @returns The AI-generated, knowledge-grounded response.
   */
  async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      if (!chatMessages.length) {
        logger.warning("Empty chatMessages array passed to KnowledgeAgent.generate");
        throw new Error("No chat messages provided.");
      }

      const lastMessage = chatMessages.at(-1)?.content || "";
      logger.info("KnowledgeAgent generating response", { lastMessageSnippet: lastMessage.slice(0, 100) });

      // Retrieve relevant documents for context
      const docs = await this.retriever.retrieve(lastMessage);
      logger.info("Documents retrieved for context", { docCount: docs.context.length });

      // Combine all retrieved context into one string
      const docsContent = docs.context.map((doc) => doc.pageContent).join("\n");

      // Prepend the context as a system-level message
      const augmentedMessages: ChatMessage[] = [{ role: "system", content: docsContent }, ...chatMessages];

      const result = await this.client.generateResponse(this.model, this.systemPrompt, augmentedMessages);
      logger.info("KnowledgeAgent response generated", { responseLength: result.response?.length });

      return result.response;
    } catch (error: any) {
      logger.error("Error generating knowledge response", { error: error.message, stack: error.stack });
      throw new Error("Failed to generate knowledge-grounded response.");
    }
  }
}
