import { createClient } from "redis";
import { redisPassword, redisURL } from '../config/loadEnv.ts';

/**
 * Redis client configured to connect to the Redis server.
 * Uses credentials and connection info from environment/config variables.
 */
const client = createClient({
  username: "default", // Default Redis username, adjust if your setup differs
  password: redisPassword,
  socket: {
    host: redisURL,  // Redis server hostname or IP address
    port: 11221,     // Redis server port, update if different
  },
});

// Log any errors emitted by the Redis client
client.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis immediately (make sure your environment supports top-level await)
await client.connect();

export default client;
