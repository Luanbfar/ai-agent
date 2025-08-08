import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { supabaseApiKey, supabaseUrl } from "../config/loadEnv";
import embeddings from "./embedder";

const client = createClient(supabaseUrl, supabaseApiKey);

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
});

export default vectorStore;
