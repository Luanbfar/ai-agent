import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { KnowledgeAgent } from "../agents/knowledge-agent";

const app = express();

app.use(cors());
app.use(express.json());

const knowledgeAgent = new KnowledgeAgent("gpt-5-nano");

app.get("/", async (req: Request, res: Response) => {
  console.log(`Request received from IP: ${req.ip}`);
  const result = await knowledgeAgent.generate(req.body.chatInput);
  res.send(result);
});

export default app;
