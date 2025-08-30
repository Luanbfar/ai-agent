import type { Request, Response } from "express";
import type { InputData } from '../types/InputData.ts';
import { AgentsService } from '../services/agents-service.ts';
import type { ChatMessage } from '../interfaces/IChatMemoryRepository.ts';

const agentsService = new AgentsService();

/**
 * Express route handler for chat requests.
 *
 * Processes user chat input, maintains session context,
 * and returns AI-generated responses.
 *
 * @param {Request} req - Express request object.
 *   Expects JSON body with:
 *     - userId: string | undefined, optional user ID
 *     - chatInput: string, required user message content
 *
 * @param {Response} res - Express response object.
 *   Sends JSON response containing:
 *     - userId: string, user ID used (new or existing)
 *     - response: string, AI-generated message
 *
 * @returns {Promise<void>}
 */
export async function handleChatRequest(req: Request, res: Response): Promise<void> {
  try {
    const { userId, chatInput } = req.body;

    if (!chatInput) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const chatMessage: ChatMessage = { role: "user", content: chatInput };
    const data: InputData = { userId, chatMessage };

    // Send chat input and session info to AI agents service
    const response = await agentsService.handleUserQuery(data);

    // Return userId (session) and AI response to client
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("An internal error occured.");
  }
}
