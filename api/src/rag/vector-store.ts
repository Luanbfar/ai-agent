import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { supabaseApiKey, supabaseUrl } from "../config/loadEnv";
import embeddings from "./embedder";

/**
 * Initializes the Supabase client using credentials from environment config.
 */
const client = createClient(supabaseUrl, supabaseApiKey);

/**
 * Creates a Supabase-backed vector store using the configured embeddings instance.
 * This store can be used to add and search vectorized documents.
 */
const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
});

export default vectorStore;
