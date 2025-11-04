import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import router from "../routers/chat-router.ts";
import { AgentClient } from "../agents/client.ts";
import { openaiApiKey } from "../config/loadEnv.ts";
import { AgentsService } from "../services/agents-service.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";

const app = express();
const agentClient = new AgentClient(openaiApiKey);
const agentsService = new AgentsService({ defaultModel: OpenAIModels.GPT5_NANO }, agentClient);

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  console.log(`Request received from IP: ${req.ip}`);
  res.send("API working!");
});

app.use("/api", router);

export default app;
export { agentsService };
