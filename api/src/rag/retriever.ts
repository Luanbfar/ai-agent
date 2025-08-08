import { Document } from "langchain/document";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import fetch from "node-fetch";
import { infinitePayUrls } from "../config/urls";
import processDocument from "./document-loader";
import vectorStore from "./vector-store";

const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

async function fetchAndProcessUrl(url: string): Promise<Document<Record<string, any>>[] | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    const docs = await processDocument(html, url);
    return docs;
  } catch (error) {
    return;
  }
}

async function addDocumentChunks() {
  try {
    const rawChunks = await Promise.all(infinitePayUrls.map((url) => fetchAndProcessUrl(url)));
    const chunks = rawChunks.filter((doc): doc is Document<Record<string, any>>[] => doc !== undefined).flat();
    await vectorStore.addDocuments(chunks);
  } catch (error) {
    console.error("Error adding document chunks:", error);
  }
}
