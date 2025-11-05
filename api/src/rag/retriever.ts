import { Document } from "langchain/document";
import fetch from "node-fetch";
import { infinitePayUrls } from "../config/urls.ts";
import processDocument from "./document-loader.ts";
import vectorStore from "./vector-store.ts";
import supabase from "../database/supabase.ts";
import type { ContextObject } from "../types/ContextObject.ts";

/**
 * Class responsible for fetching, processing, and retrieving documents
 * related to InfinitePay from configured URLs.
 */
export class DocumentRetriever {
  private readonly MAX_AGE_HOURS = 24;

  constructor() {}

  /**
   * Checks if documents in the vector store are up-to-date.
   *
   * Queries the most recent document's created_at timestamp and compares
   * it against the maximum age threshold (24 hours by default).
   *
   * @returns Promise resolving to true if documents are fresh, false if stale
   */
  private async isDocumentUpToDate(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log("No documents found in vector store, needs refresh");
        return false;
      }

      const lastUpdate = new Date(data.created_at);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

      const isUpToDate = hoursSinceUpdate < this.MAX_AGE_HOURS;

      if (!isUpToDate) {
        console.log(`Documents are ${hoursSinceUpdate.toFixed(2)} hours old, refresh needed`);
      }

      return isUpToDate;
    } catch (error) {
      console.error("Error checking document freshness:", error);
      return false; // Assume stale on error to trigger refresh
    }
  }

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
      console.log("Refreshing document chunks...");

      const rawChunks = await Promise.all(infinitePayUrls.map((url) => this.fetchAndProcessUrl(url)));

      // Filter out undefined results and flatten the array of arrays
      const chunks = rawChunks.filter((doc): doc is Document<Record<string, any>>[] => doc !== undefined).flat();

      if (chunks.length > 0) {
        await vectorStore.addDocuments(chunks);
        console.log(`Added ${chunks.length} chunks from ${infinitePayUrls.length} URLs.`);
      } else {
        console.log("No chunks to add");
      }
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
      const upToDate = await this.isDocumentUpToDate();

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
