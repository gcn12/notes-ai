"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const GPT3Tokenizer = require("gpt3-tokenizer");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3002;
app.use((0, cors_1.default)());
app.post("/", (req, res) => {
    const text = "The main difference between this library and gpt-3-encoder is that this library supports both gpt3 and codex tokenization (The dictionary is taken directly from OpenAI so the tokenization result is on par with the OpenAI Playground). Also Map API is used instead of JavaScript objects, especially the bpeRanks object, which should see some performance improvement.";
    const tokenized = splitIntoChunks(text);
    console.log(tokenized);
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
const MAX_TOKEN = 30;
function splitIntoChunks(inputText) {
    const Tokenizer = GPT3Tokenizer.default;
    const chunks = [];
    let chunk = {
        tokens: [],
        start: 0,
        end: 0,
    };
    let start = 0;
    const tokenizer = new Tokenizer({ type: "gpt3" });
    const data = tokenizer.encode(inputText);
    const text = data.text;
    for (const word of text) {
        const newChunkTokens = [...chunk.tokens, word];
        if (newChunkTokens.length > MAX_TOKEN) {
            const text = chunk.tokens.join("");
            chunks.push({
                text,
                start,
                end: start + text.length,
            });
            start += text.length + 1;
            chunk = {
                tokens: [word],
                start,
                end: start,
            };
        }
        else {
            chunk = Object.assign(Object.assign({}, chunk), { tokens: newChunkTokens });
        }
    }
    chunks.push(Object.assign(Object.assign({}, chunk), { text: chunk.tokens.join("") }));
    return chunks;
}
