import { type Request, type Response } from "express";
import prisma from "../utils/prisma.js";
import { generateEmbedding } from "../utils/embeddings.js";
import { cosineSimilarity } from "../utils/similarity.js";

export const search = async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: "Missing query ?q=" });
  }

  // 1. Generate embedding for user query
  const queryEmbedding = await generateEmbedding(query);

  // 2. Fetch blogs with embeddings
  const blogs = await prisma.blogPost.findMany({
    where: { embedding: { not: null } }
  });

  // 3. Compute similarity for each blog
  const scored = blogs.map((blog) => ({
    ...blog,
    score: cosineSimilarity(queryEmbedding, blog.embedding as number[])
  }));

  // 4. Sort by similarity (descending)
  scored.sort((a, b) => b.score - a.score);

  // 5. Return top results
  res.json({
    query,
    results: scored.slice(0, 10) // top 10 semantic results
  });
};