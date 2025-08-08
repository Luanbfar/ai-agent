import { Agent } from "./agent";
import { orchestratorInstruction } from "./prompts";

export class OrchestratorAgent extends Agent {
  constructor(model: string, systemPrompt: string = orchestratorInstruction) {
    super(model, systemPrompt);
  }

  override async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: [{ role: "user", content: prompt }],
      });

      return response.output_text;
    } catch (error) {
      console.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
