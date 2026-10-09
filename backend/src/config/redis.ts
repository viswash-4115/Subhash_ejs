import IORedis from "ioredis";
import { config } from "./index";

export function createRedisConnection(): IORedis {
  if (config.redis.url) {
    return new IORedis(config.redis.url, { maxRetriesPerRequest: null });
  }
  return new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
  });
}
