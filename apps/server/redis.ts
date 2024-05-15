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

export const checkRateLimit = async () => {
  const limitRes = await redis.get("limit");
  if (limitRes) {
    const { tokens, time } = JSON.parse(limitRes);
    if (tokens === 0) {
      if (Math.floor(Date.now() / 1000) - time > 20) {
        redis.set(
          "limit",
          JSON.stringify({ time: getUnixSeconds(), tokens: 3 })
        );
      } else {
        return true;
      }
    } else {
      redis.set("limit", JSON.stringify({ time, tokens: tokens - 1 }));
      return false;
    }
  } else {
    redis.set("limit", JSON.stringify({ time: getUnixSeconds(), tokens: 3 }));
    return false;
  }
};
