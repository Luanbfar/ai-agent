import * as cheerio from "cheerio";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Extracts and returns the plain text content from the body of an HTML string.
 *
 * @param {string} html - The raw HTML content to parse.
 * @returns {string} The extracted and trimmed text content.
 * @throws Will throw an error if the HTML content is empty or undefined.
 */
function parseHTMLDocument(html: string): string {
  if (!html) {
    throw new Error("HTML content is empty or undefined");
  }
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, link").remove();
  const text = $("body").text() || "";
  return text.trim();
}

/**
 * Processes an HTML document by parsing its text content,
 * splitting it into manageable chunks, and returning an array of Documents.
 *
 * @param {string} html - The raw HTML content of the document.
 * @param {string} url - The source URL of the document, stored as metadata.
 * @returns {Promise<Document[] | undefined>} An array of split Document chunks,
 * or undefined if an error occurs during processing.
 */
export default async function processDocument(html: string, url: string): Promise<Document[] | undefined> {
  try {
    const document = new Document({
      pageContent: parseHTMLDocument(html),
      metadata: { source: url },
    });

    const chunks = await splitter.splitDocuments([document]);

    return chunks;
  } catch (error) {
    console.error("Error loading document:", error);
    return undefined;
  }
}
