import { createClient } from "redis";
import { redisURL } from "../config/loadEnv.ts";

/**
 * Redis client configured to connect to the Redis server.
 * Uses credentials and connection info from environment/config variables.
 */
const client = createClient({
  username: "default", // Default Redis username, adjust if your setup differs
  url: redisURL,
});

// Log any errors emitted by the Redis client
client.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis immediately (make sure your environment supports top-level await)
await client.connect();

export default client;
