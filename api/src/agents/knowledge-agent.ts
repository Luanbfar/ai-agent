import { ChatMessage } from "../interfaces/IChatMemoryRepository";
import { DocumentRetriever } from "../rag/retriever";
import { OpenAIModels } from "../types/OpenAIModels";
import { Agent } from "./agent";
import { knowledgeAgentInstruction } from "./prompts";

export class KnowledgeAgent extends Agent {
  private retriever: DocumentRetriever;
  constructor(model?: OpenAIModels, systemPrompt: string = knowledgeAgentInstruction) {
    super(model, systemPrompt);
    this.retriever = new DocumentRetriever();
  }

  async generate(chatMessages: ChatMessage[]): Promise<string> {
    try {
      const messagesContent = chatMessages.map((message) => message.content);
      const lastMessage = messagesContent[messagesContent.length - 1] as string;
      const docs = await this.retriever.retrieve(lastMessage);
      const docsContent = docs.context.map((doc) => doc.pageContent).join("\n");
      const augmentedMessages = [{ role: "system", content: docsContent }, ...chatMessages] as ChatMessage[];
      const response = await this.client.responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: augmentedMessages,
      });

      return response.output_text;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
