import { DocumentRetriever } from "../rag/retriever";
import { Agent } from "./agent";
import { knowledgeAgentInstruction } from "./prompts";

export class KnowledgeAgent extends Agent {
  private retriever: DocumentRetriever;
  constructor(model: string, systemPrompt: string = knowledgeAgentInstruction) {
    super(model, systemPrompt);
    this.retriever = new DocumentRetriever();
  }

  async generate(prompt: string): Promise<string> {
    try {
      const docs = await this.retriever.retrieve(prompt);
      const docsContent = docs.context.map((doc) => doc.pageContent).join("\n");
      const response = await this.client.responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: [
          { role: "system", content: docsContent },
          { role: "user", content: prompt },
        ],
      });

      return response.output_text;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
