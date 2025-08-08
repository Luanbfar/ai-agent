import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
// import loadDocument from "../rag/document-loader";

const app = express();

app.use(cors());
app.use(express.json());

app.get(
  "/",
  async (req: Request, res: Response) => {
    console.log(`Request received from IP: ${req.ip}`);
    // const test = await fetch("https://example.com");
    // const html = await test.text();
    // const document = loadDocument(html);
    // console.log("Document loaded successfully");
    // res.send(document);
    res.send("API Working!");
  }
);

export default app;
