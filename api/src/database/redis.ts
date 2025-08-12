import { createClient } from "redis";
import { redisPassword, redisURL } from "../config/loadEnv";

const client = createClient({
  username: "default",
  password: redisPassword,
  socket: {
    host: redisURL,
    port: 11221,
  },
});

client.on("error", (err) => console.error("Redis Client Error", err));

await client.connect();

export default client;
