import { cleanEnv, num, str } from "envalid";
import "dotenv/config";

const env = cleanEnv(process.env, {
  PORT: num({
    default: 3000,
    desc: "The port on which the server will run",
  }),
  OPENAI_API_KEY: str({
    desc: "The API key for OpenAI services",
  }),
  SUPABASE_URL: str({
    desc: "The URL for the Supabase instance",
  }),
  SUPABASE_API_KEY: str({
    desc: "The API key for the Supabase instance",
  }),
  REDIS_PASSWORD: str({
    desc: "The password for the Redis client",
  }),
  REDIS_URL: str({
    desc: "The host URL for the Redis client",
  }),
  MONGODB_URL: str({
    desc: "The URL for the MongoDB database",
  }),
});

export const port = env.PORT;
export const openaiApiKey = env.OPENAI_API_KEY;
export const supabaseUrl = env.SUPABASE_URL;
export const supabaseApiKey = env.SUPABASE_API_KEY;
export const redisPassword = env.REDIS_PASSWORD;
export const redisURL = env.REDIS_URL;
export const mongoURL = env.MONGODB_URL;
