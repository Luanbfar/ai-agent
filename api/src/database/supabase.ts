import { createClient } from "@supabase/supabase-js";
import { supabaseApiKey, supabaseUrl } from "../config/loadEnv.ts";

/**
 * Initializes the Supabase client using credentials from environment config.
 */
const client = createClient(supabaseUrl, supabaseApiKey);

export default client;
