import { Request, Response } from "express";

export function handleChatRequest(req: Request, res: Response): void {
  const { message } = req.body;
    if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
    }
}