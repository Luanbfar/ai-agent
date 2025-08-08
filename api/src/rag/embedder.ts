import { OpenAIEmbeddings } from "@langchain/openai";
import { openaiApiKey } from "../config/loadEnv";

const embeddings = new OpenAIEmbeddings({
  apiKey: openaiApiKey,
  model: "text-embedding-3-small",
});

export default embeddings;
