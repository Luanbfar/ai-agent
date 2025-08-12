import { Document } from "langchain/document";
import fetch from "node-fetch";
import { infinitePayUrls } from "../config/urls";
import processDocument from "./document-loader";
import vectorStore from "./vector-store";
import { isDocumentUpToDate, logDocumentUpdate } from "../utils/log";
import { ContextObject } from "../types/ContextObject";

/**
 * Class responsible for fetching, processing, and retrieving documents
 * related to InfinitePay from configured URLs.
 */
export class DocumentRetriever {
  constructor() {}

  /**
   * Fetches HTML content from a URL and processes it into document chunks.
   * @param url - URL to fetch and process.
   * @returns Array of processed Document chunks or undefined on failure.
   */
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
      return undefined;
    }
  }

  /**
   * Fetches and processes all configured URLs,
   * then adds the resulting document chunks to the vector store.
   */
  private async addDocumentChunks(): Promise<void> {
    try {
      const rawChunks = await Promise.all(infinitePayUrls.map((url) => this.fetchAndProcessUrl(url)));

      // Filter out undefined results and flatten the array of arrays
      const chunks = rawChunks.filter((doc): doc is Document<Record<string, any>>[] => doc !== undefined).flat();

      await vectorStore.addDocuments(chunks);

      logDocumentUpdate(`Added ${chunks.length} chunks from ${infinitePayUrls.length} URLs.`);
    } catch (error) {
      console.error("Error adding document chunks:", error);
    }
  }

  /**
   * Retrieves context documents relevant to the provided question.
   * Checks if documents are up-to-date before retrieving.
   * @param question - The query string to search for relevant documents.
   * @returns An object containing an array of matching documents as context.
   */
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
