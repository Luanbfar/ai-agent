import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import router from "../routers/chat-router.ts";
import { AgentClient } from "../agents/client.ts";
import { openaiApiKey } from "../config/loadEnv.ts";
import { AgentsService } from "../services/agents-service.ts";
import { OpenAIModels } from "../types/OpenAIModels.ts";
import { MongoTicketRepository } from "../repositories/MongoTicket.ts";
import { TicketService } from "../services/tickets-service.ts";
import { RedisChatMemory } from "../repositories/RedisChatMemory.ts";

const app = express();
const mongoTicketRepository = new MongoTicketRepository();
const redisChatMemory = new RedisChatMemory();
const serviceConfig = {
  chatMemoryRepo: redisChatMemory,
  defaultModel: OpenAIModels.GPT5_NANO,
};
const agentClient = new AgentClient(openaiApiKey);
const ticketService = new TicketService(mongoTicketRepository);
export const agentsService = new AgentsService(serviceConfig, agentClient, ticketService);

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  console.log(`Request received from IP: ${req.ip}`);
  res.send("API working!");
});

app.use("/api", router);

export default app;
