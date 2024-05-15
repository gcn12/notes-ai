import express from "express";
import dotenv from "dotenv";
const GPT3Tokenizer = require("gpt3-tokenizer");
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "./redis";

dotenv.config();
const app = express();

const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY as string;
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_API_KEY);

const openai = new OpenAI({
  apiKey: OPEN_AI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(async (req, res, next) => {
  const isLimit = await checkRateLimit();
  if (isLimit) {
    res.status(409).send("rate limit exceeded");
  } else {
    next();
  }
});

app.post("/", (req, res) => {
  const tokenized = getChunksOfText(req.body.text);
  saveEmbeddings(tokenized);
  res.sendStatus(200);
});

app.get("/search", async (req, res) => {
  if (typeof req.query.search === "string") {
    const data = await getDocuments(req.query.search);
    if (data.length == 0) {
      res.json({ data: "No matching info available" });
    } else {
      let text = "";
      for (const item of data) {
        text += item.content;
      }
      const answer = await getAnswer(req.query.search, data[0].content);
      res.json({ data: answer });
    }
  } else {
    res.json({ data: "" });
  }
});

app.listen(process.env.PORT || 3006, () => {
  console.log(`[server]: Server is running at http://localhost:${3006}`);
});

const getChunksOfText = (inputText: string) => {
  const MAX_TOKEN = 200;
  const Tokenizer = GPT3Tokenizer.default;
  const chunks = [];
  let currentChunk: string[] = [];

  const tokenizer = new Tokenizer({ type: "gpt3" });
  const data = tokenizer.encode(inputText);
  const textList = data.text as string[];

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

const saveEmbeddings = async (chunks: string[]) => {
  for await (const chunk of chunks) {
    const embed = await getEmbedding(chunk);
    const embedding = embed;

    try {
      const data = await supabaseClient.from("documents").insert({
        embedding,
        content: chunk,
      });
    } catch (err) {
      console.log(err);
    }
  }
};

const getEmbedding = async (chunk: string) => {
  const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";
  const embed = await openai.embeddings.create({
    input: chunk,
    model: OPENAI_EMBEDDING_MODEL,
  });
  return embed.data[0].embedding;
};

const getDocuments = async (query: string) => {
  const embedding = await getEmbedding(query);

  const { data: documents } = await supabaseClient.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.8,
    match_count: 3,
  });

  return documents;
};

const getAnswer = async (query: string, contextText: string) => {
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

  const completionResponse = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt,
    max_tokens: 300,
    temperature: 0, // Set to 0 for deterministic results
  });

  return completionResponse.choices[0].text.replace("\n", "");
};
