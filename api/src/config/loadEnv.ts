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
});

export const port = env.PORT;
export const openaiApiKey = env.OPENAI_API_KEY;
export const supabaseUrl = env.SUPABASE_URL;
export const supabaseApiKey = env.SUPABASE_API_KEY;
