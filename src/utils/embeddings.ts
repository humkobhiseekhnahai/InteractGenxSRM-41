import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini embedding model name (latest as of 2025)
const MODEL_NAME = "text-embedding-004";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) return [];

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.embedContent(text);

  // Gemini returns embedding inside embedding.values
  return result.embedding.values;
}