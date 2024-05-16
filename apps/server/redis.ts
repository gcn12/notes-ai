import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();
export const redis = new Redis({
  host: process.env.REDISHOST || "",
  port: Number(process.env.REDISPORT),
  password: process.env.REDISPASSWORD || "",
});

const getUnixSeconds = () => {
  return Math.floor(Date.now() / 1000);
};

export const isRateLimit = async () => {
  const limitObj = await redis.get("limit");

  if (!limitObj) {
    redis.set("limit", JSON.stringify({ time: getUnixSeconds(), tokens: 3 }));
    return false;
  }

  const { tokens, time } = JSON.parse(limitObj);
  if (tokens === 0) {
    if (Math.floor(Date.now() / 1000) - time > 20) {
      redis.set("limit", JSON.stringify({ time: getUnixSeconds(), tokens: 3 }));
      return false;
    }
    return true;
  }

  redis.set("limit", JSON.stringify({ time, tokens: tokens - 1 }));
  return false;
};
