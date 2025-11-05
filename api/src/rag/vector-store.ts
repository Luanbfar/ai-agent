import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import embeddings from "./embedder.ts";
import client from "../database/supabase.ts";

/**
 * Creates a Supabase-backed vector store using the configured embeddings instance.
 * This store can be used to add and search vectorized documents.
 */
const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
});

export default vectorStore;
