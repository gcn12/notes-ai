"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRateLimit = exports.redis = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.redis = new ioredis_1.Redis({
    host: process.env.REDISHOST || "",
    port: Number(process.env.REDISPORT),
    password: process.env.REDISPASSWORD || "",
});
const getUnixSeconds = () => {
    return Math.floor(Date.now() / 1000);
};
const isRateLimit = () => __awaiter(void 0, void 0, void 0, function* () {
    const limitObj = yield exports.redis.get("limit");
    if (!limitObj) {
        exports.redis.set("limit", JSON.stringify({ time: getUnixSeconds(), tokens: 3 }));
        return false;
    }
    const { tokens, time } = JSON.parse(limitObj);
    if (tokens === 0) {
        if (Math.floor(Date.now() / 1000) - time > 20) {
            exports.redis.set("limit", JSON.stringify({ time: getUnixSeconds(), tokens: 3 }));
            return false;
        }
        return true;
    }
    exports.redis.set("limit", JSON.stringify({ time, tokens: tokens - 1 }));
    return false;
});
exports.isRateLimit = isRateLimit;
