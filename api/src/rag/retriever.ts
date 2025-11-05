import { Document } from "langchain/document";
import fetch from "node-fetch";
import { infinitePayUrls } from "../config/urls.ts";
import processDocument from "./document-loader.ts";
import vectorStore from "./vector-store.ts";
import supabase from "../database/supabase.ts";
import { logger } from "../utils/logger.ts";
import type { ContextObject } from "../types/ContextObject.ts";

/**
 * DocumentRetriever manages the RAG (Retrieval-Augmented Generation) pipeline.
 *
 * Responsibilities:
 * - Fetches and processes HTML content from configured InfinitePay URLs
 * - Maintains document freshness using Supabase timestamps (7-days cache)
 * - Performs vector similarity search for relevant context retrieval
 * - Automatically refreshes stale documents
 *
 * @example
 * ```typescript
 * const retriever = new DocumentRetriever();
 * const result = await retriever.retrieve("What are your business hours?");
 * // Returns: { context: [Document, Document, ...] }
 * ```
 */
export class DocumentRetriever {
  private readonly MAX_AGE_HOURS = 168; // 7 days

  constructor() {
    logger.info("DocumentRetriever initialized");
  }

  /**
   * Checks if documents in the vector store are up-to-date.
   *
   * Queries Supabase for the most recent document's created_at timestamp
   * and compares it against the maximum age threshold (24 hours by default).
   *
   * @returns Promise resolving to true if documents are fresh, false if stale or not found
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
        logger.warning("No documents found in vector store, refresh needed");
        return false;
      }

      const lastUpdate = new Date(data.created_at);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

      const isUpToDate = hoursSinceUpdate < this.MAX_AGE_HOURS;

      if (!isUpToDate) {
        logger.info(`Documents are stale`, {
          hoursSinceUpdate: hoursSinceUpdate.toFixed(2),
          threshold: this.MAX_AGE_HOURS,
        });
      }

      return isUpToDate;
    } catch (error) {
      logger.error("Failed to check document freshness", { error });
      return false;
    }
  }

  /**
   * Fetches HTML content from a URL and processes it into document chunks.
   *
   * @param url - URL to fetch and process
   * @returns Array of processed Document chunks or undefined on failure
   */
  private async fetchAndProcessUrl(url: string): Promise<Document<Record<string, any>>[] | undefined> {
    try {
      logger.info(`Fetching document from ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      const html = await response.text();
      const docs = await processDocument(html, url);

      if (docs) {
        logger.info(`Processed ${docs.length} chunks from ${url}`);
      }

      return docs;
    } catch (error) {
      logger.error(`Error fetching and processing URL: ${url}`, { error });
      return undefined;
    }
  }

  /**
   * Fetches and processes all configured URLs,
   * then adds the resulting document chunks to the vector store.
   *
   * @returns Promise that resolves when all documents are added
   */
  private async addDocumentChunks(): Promise<void> {
    try {
      logger.info("Starting document refresh", { urlCount: infinitePayUrls.length });

      const rawChunks = await Promise.all(infinitePayUrls.map((url) => this.fetchAndProcessUrl(url)));

      const chunks = rawChunks.filter((doc): doc is Document<Record<string, any>>[] => doc !== undefined).flat();

      if (chunks.length > 0) {
        await vectorStore.addDocuments(chunks);
        logger.info("Document refresh completed", {
          chunkCount: chunks.length,
          urlCount: infinitePayUrls.length,
        });
      } else {
        logger.warning("No chunks to add during refresh");
      }
    } catch (error) {
      logger.error("Document refresh failed", { error });
    }
  }

  /**
   * Retrieves context documents relevant to the provided question.
   *
   * Workflow:
   * 1. Checks if documents are up-to-date (24-hour cache)
   * 2. Refreshes documents if stale
   * 3. Performs similarity search to find relevant context
   * 4. Returns top 5 matching documents
   *
   * @param question - The query string to search for relevant documents
   * @returns Object containing an array of matching documents as context
   */
  public async retrieve(question: string): Promise<ContextObject> {
    try {
      logger.info("Starting document retrieval", { question });

      const upToDate = await this.isDocumentUpToDate();

      if (!upToDate) {
        await this.addDocumentChunks();
      }

      const retrievedDocs = await vectorStore.similaritySearch(question, 5);

      logger.info("Document retrieval completed", {
        documentsFound: retrievedDocs.length,
      });

      return { context: retrievedDocs };
    } catch (error) {
      logger.error("Document retrieval failed", { error, question });
      return { context: [] };
    }
  }
}
