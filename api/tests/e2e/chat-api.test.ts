import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { describe, expect, it, jest, beforeEach, beforeAll } from "@jest/globals";

// Mock heavy dependencies before importing app logic
jest.mock("openai", () => {
  const mockCreate = jest.fn();
  class MockOpenAI {
    responses = { create: mockCreate };
  }
  return { __esModule: true, default: MockOpenAI, __mockCreate: mockCreate };
});

jest.mock("../../src/repositories/RedisChatMemory", () => ({
  RedisChatMemory: jest.fn().mockImplementation(
    (): IChatMemoryRepository => ({
      getConversation: jest.fn<any>().mockResolvedValue([]),
      appendMessage: jest.fn<any>().mockResolvedValue(undefined),
      clearConversation: jest.fn<any>().mockResolvedValue(undefined),
    })
  ),
}));

jest.mock("../../src/repositories/MongoTicket", () => ({
  MongoTicketRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockImplementation((ticket: any) =>
      Promise.resolve({
        ...ticket,
        id: "ticket-123",
        createdAt: new Date("2025-01-01T10:00:00Z"),
      })
    ),
  })),
}));

// Import the handler after mocks
import { handleChatRequest } from "../../src/controllers/chat-controller";
import { AgentType } from "../../src/types/AgentType";
import { IChatMemoryRepository } from "../../src/interfaces/IChatMemoryRepository";

describe("Chat API E2E", () => {
  let app: express.Express;
  let mockCreate: jest.Mock<any>;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.post("/api/chat", handleChatRequest);

    const openaiModule = await import("openai");
    mockCreate = (openaiModule as any).__mockCreate;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a knowledge agent response", async () => {
    // Orchestrator says: "knowledgeAgent"
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ agentType: AgentType.knowledgeAgent }),
    });
    // Knowledge agent generates the response
    mockCreate.mockResolvedValueOnce({ output_text: "We are open Mon–Fri 9am–6pm" });
    // Personality agent adds personality
    mockCreate.mockResolvedValueOnce({ output_text: "Sure! We’re open Mon–Fri, 9am–6pm 😊" });

    const res = await request(app).post("/api/chat").send({ chatInput: "What are your business hours?" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userId");
    expect(res.body.response).toMatch(/open Mon–Fri/i);
  });

  it("should create a ticket when instructed", async () => {
    // Orchestrator says: "csAgent"
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ agentType: AgentType.csAgent }),
    });
    // CS Agent returns ticket creation JSON
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({
        action: "create_ticket",
        subject: "Account issue",
        description: "Unable to login",
        status: "open",
      }),
    });

    const res = await request(app).post("/api/chat").send({ chatInput: "I can't login, please create a ticket" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ticketResponse");
    expect(res.body.ticketResponse).toMatch(/Ticket created successfully/i);
  });

  it("should return 400 when chatInput is missing", async () => {
    const res = await request(app).post("/api/chat").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Message is required" });
  });

  it("should handle internal server errors gracefully", async () => {
    // Force orchestrator to throw
    mockCreate.mockRejectedValue(new Error("OpenAI API failure"));

    const res = await request(app).post("/api/chat").send({ chatInput: "trigger error" });

    expect(res.status).toBe(500);
  });
});
