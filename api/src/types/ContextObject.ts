import type { DocumentInterface } from "@langchain/core/documents";

export type ContextObject = {
  context: DocumentInterface<Record<string, any>>[];
};
