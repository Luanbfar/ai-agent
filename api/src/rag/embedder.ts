import { OpenAIEmbeddings } from "@langchain/openai";
import { openaiApiKey } from "../config/loadEnv";

/**
 * OpenAI embeddings instance configured to use the 'text-embedding-3-small' model.
 * Used for generating vector embeddings from text inputs.
 */
const embeddings = new OpenAIEmbeddings({
  apiKey: openaiApiKey,
  model: "text-embedding-3-small",
});

export default embeddings;
