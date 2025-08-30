import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import router from '../routers/chat-router.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  console.log(`Request received from IP: ${req.ip}`);
  res.send("API working!");
});

app.use("/api", router);

export default app;
