import { Document } from "langchain/document";
import fetch from "node-fetch";
import { infinitePayUrls } from "../config/urls";
import processDocument from "./document-loader";
import vectorStore from "./vector-store";
import { isDocumentUpToDate, logDocumentUpdate } from "../utils/log";
import { DocumentInterface } from "@langchain/core/documents";

type ContextObject = {
  context: DocumentInterface<Record<string, any>>[];
};

export class DocumentRetriever {
  constructor() {}

  private async fetchAndProcessUrl(url: string): Promise<Document<Record<string, any>>[] | undefined> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      const html = await response.text();
      const docs = await processDocument(html, url);
      return docs;
    } catch (error) {
      console.error("Error fetching and processing url:", error);
      return;
    }
  }

  private async addDocumentChunks(): Promise<void> {
    try {
      const rawChunks = await Promise.all(infinitePayUrls.map((url) => this.fetchAndProcessUrl(url)));
      const chunks = rawChunks.filter((doc): doc is Document<Record<string, any>>[] => doc !== undefined).flat();
      await vectorStore.addDocuments(chunks);
      logDocumentUpdate(`Added ${chunks.length} chunks from ${infinitePayUrls.length} URLs.`);
    } catch (error) {
      console.error("Error adding document chunks:", error);
    }
  }

  public async retrieve(question: string): Promise<ContextObject> {
    try {
      const upToDate = await isDocumentUpToDate();
      if (!upToDate) {
        await this.addDocumentChunks();
      }
      const retrievedDocs = await vectorStore.similaritySearch(question, 5);
      return { context: retrievedDocs };
    } catch (error) {
      console.error("Error in retrieve():", error);
      return { context: [] };
    }
  }
}
