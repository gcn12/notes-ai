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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const GPT3Tokenizer = require("gpt3-tokenizer");
const cors_1 = __importDefault(require("cors"));
const openai_1 = __importDefault(require("openai"));
const supabase_js_1 = require("@supabase/supabase-js");
const redis_1 = require("./redis");
dotenv_1.default.config();
const app = (0, express_1.default)();
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const supabaseClient = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_API_KEY);
const openai = new openai_1.default({
    apiKey: OPEN_AI_API_KEY,
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const isLimit = yield (0, redis_1.checkRateLimit)();
    if (isLimit) {
        res.status(409).send("rate limit exceeded");
    }
    else {
        next();
    }
}));
app.post("/", (req, res) => {
    const tokenized = getChunksOfText(req.body.text);
    saveEmbeddings(tokenized);
    res.sendStatus(200);
});
app.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof req.query.search === "string") {
        const data = yield getDocuments(req.query.search);
        if (data.length == 0) {
            res.json({ data: "No matching info available" });
        }
        else {
            let text = "";
            for (const item of data) {
                text += item.content;
            }
            const answer = yield getAnswer(req.query.search, data[0].content);
            res.json({ data: answer });
        }
    }
    else {
        res.json({ data: "" });
    }
}));
app.listen(process.env.PORT || 3006, () => {
    console.log(`[server]: Server is running at http://localhost:${3006}`);
});
const getChunksOfText = (inputText) => {
    const MAX_TOKEN = 200;
    const Tokenizer = GPT3Tokenizer.default;
    const chunks = [];
    let currentChunk = [];
    const tokenizer = new Tokenizer({ type: "gpt3" });
    const data = tokenizer.encode(inputText);
    const textList = data.text;
    for (const word of textList) {
        currentChunk.push(word);
        if (currentChunk.length >= MAX_TOKEN) {
            chunks.push(currentChunk.join(""));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(""));
    }
    return chunks;
};
const saveEmbeddings = (chunks) => { var _a, chunks_1, chunks_1_1; return __awaiter(void 0, void 0, void 0, function* () {
    var _b, e_1, _c, _d;
    try {
        for (_a = true, chunks_1 = __asyncValues(chunks); chunks_1_1 = yield chunks_1.next(), _b = chunks_1_1.done, !_b; _a = true) {
            _d = chunks_1_1.value;
            _a = false;
            const chunk = _d;
            const embed = yield getEmbedding(chunk);
            const embedding = embed;
            try {
                const data = yield supabaseClient.from("documents").insert({
                    embedding,
                    content: chunk,
                });
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_a && !_b && (_c = chunks_1.return)) yield _c.call(chunks_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}); };
const getEmbedding = (chunk) => __awaiter(void 0, void 0, void 0, function* () {
    const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";
    const embed = yield openai.embeddings.create({
        input: chunk,
        model: OPENAI_EMBEDDING_MODEL,
    });
    return embed.data[0].embedding;
});
const getDocuments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const embedding = yield getEmbedding(query);
    const { data: documents } = yield supabaseClient.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.8,
        match_count: 3,
    });
    return documents;
});
const getAnswer = (query, contextText) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `
  You are a very enthusiastic representative who loves
  to help people! Answer the question by using the context. If you are unsure and the answer
  is not explicitly written in the context, say
  "Sorry, I don't know how to help with that."

  Context sections:
  ${contextText}

  Question: """
  ${query}
  """

  Answer as plain text
`;
    const completionResponse = yield openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 300,
        temperature: 0, // Set to 0 for deterministic results
    });
    return completionResponse.choices[0].text.replace("\n", "");
});
