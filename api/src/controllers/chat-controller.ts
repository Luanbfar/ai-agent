import { Request, Response } from "express";
import { InputData } from "../types/InputData";
import { AgentsService } from "../services/agents-service";
import { ChatMessage } from "../interfaces/IChatMemoryRepository";

const agentsService = new AgentsService();

export async function handleChatRequest(req: Request, res: Response): Promise<void> {
  try {
    const { userId, chatInput } = req.body;
    if (!chatInput) {
      res.status(400).json({ error: "Message is required" });
      return;
    }
    const chatMessage: ChatMessage = { role: "user", content: chatInput };
    const data: InputData = { userId, chatMessage };
    const response = await agentsService.handleUserQuery(data);
    res.send(response);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}
