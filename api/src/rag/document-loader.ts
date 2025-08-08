import * as cheerio from "cheerio";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

function parseHTMLDocument(html: string): string {
  if (!html) {
    throw new Error("HTML content is empty or undefined");
  }
  const $ = cheerio.load(html);
  const text = $("body").text() || "";
  return text.trim();
}

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
