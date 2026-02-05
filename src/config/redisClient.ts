import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASS = process.env.REDIS_PASS;

const initializeRedisClient = async () => {
  if (!REDIS_ENDPOINT || !REDIS_PORT || !REDIS_PASS)
    throw new Error("Redis details required");

  if (!client) {
    client = createClient({
      username: "default",
      password: REDIS_PASS,
      socket: {
        host: REDIS_ENDPOINT,
        port: Number(REDIS_PORT),
        reconnectStrategy: (retries) => {
          if (retries > 5) return new Error("Redis reconnect failed");
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on("error", (error) => console.error("Redis client error", error));
    client.on("ready", () => console.log("Redis authenticated & ready"));
    client.on("connect", () => console.log("Redis connected"));
    await client.connect();
  }
  return client;
};

export { initializeRedisClient };
