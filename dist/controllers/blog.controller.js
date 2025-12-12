import prisma from "../utils/prisma.js";
import { generateEmbedding } from "../utils/embeddings.js";
import { cosineSimilarity } from "../utils/similarity.js";
// GET /blogs/:id
export const getBlogById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
        }
        const blog = await prisma.blogPost.findUnique({
            where: { id },
        });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        // Fetch related concepts manually
        const concepts = await prisma.concept.findMany({
            where: { id: { in: blog.conceptIds } },
        });
        // Fetch related blogs manually
        const relatedBlogs = await prisma.blogPost.findMany({
            where: { id: { in: blog.relatedIds } },
        });
        return res.json({
            ...blog,
            concepts,
            related: relatedBlogs,
        });
    }
    catch (err) {
        console.error("getBlogById error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
export const createBlog = async (req, res) => {
    try {
        const { title, slug, content, excerpt } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "title and content are required" });
        }
        // 1) Generate embedding for the blog
        const embedding = await generateEmbedding(`${title}\n\n${content}`);
        // ---------------------------------------------
        // PART A: Concept Auto-Tagging (your existing logic)
        // ---------------------------------------------
        const existingConcepts = await prisma.concept.findMany({
            where: { embedding: { not: null } }
        });
        const THRESHOLD = 0.50;
        const matchedConceptIds = [];
        for (const concept of existingConcepts) {
            const conceptVec = concept.embedding;
            if (!conceptVec || conceptVec.length !== embedding.length)
                continue;
            const score = cosineSimilarity(embedding, conceptVec);
            if (score >= THRESHOLD)
                matchedConceptIds.push(concept.id);
        }
        // If none match → create a new concept
        let finalConceptIds = matchedConceptIds;
        if (finalConceptIds.length === 0) {
            const newConcept = await prisma.concept.create({
                data: {
                    name: title,
                    slug: slug ? slug : title.toLowerCase().replace(/\s+/g, "-"),
                    embedding,
                    blogPostIds: [],
                    relatedIds: []
                }
            });
            finalConceptIds = [newConcept.id];
        }
        // ---------------------------------------------
        // PART B: Auto-Related Blog Linking
        // ---------------------------------------------
        const otherBlogs = await prisma.blogPost.findMany({
            where: { embedding: { not: null } }
        });
        const similarities = [];
        for (const oldBlog of otherBlogs) {
            const oldVec = oldBlog.embedding;
            if (!oldVec || oldVec.length !== embedding.length)
                continue;
            const score = cosineSimilarity(embedding, oldVec);
            similarities.push({ id: oldBlog.id, score });
        }
        // Sort by similarity (high → low)
        similarities.sort((a, b) => b.score - a.score);
        // Pick top-N related blogs (tune N as needed)
        const RELATED_COUNT = 3;
        const relatedIds = similarities.slice(0, RELATED_COUNT).map(s => s.id);
        // ---------------------------------------------
        // PART C: Create blog entry
        // ---------------------------------------------
        const blog = await prisma.blogPost.create({
            data: {
                title,
                slug: slug ? slug : title.toLowerCase().replace(/\s+/g, "-"),
                content,
                excerpt: excerpt ?? null,
                embedding,
                conceptIds: finalConceptIds,
                relatedIds
            }
        });
        // ---------------------------------------------
        // PART D: Update each related blog to include THIS new blog (bidirectional linking)
        // ---------------------------------------------
        for (const rid of relatedIds) {
            await prisma.blogPost.update({
                where: { id: rid },
                data: {
                    relatedIds: { push: blog.id }
                }
            });
        }
        // ---------------------------------------------
        // PART E: Update concepts with this new blog ID
        // ---------------------------------------------
        for (const conceptId of finalConceptIds) {
            await prisma.concept.update({
                where: { id: conceptId },
                data: {
                    blogPostIds: { push: blog.id }
                }
            });
        }
        // Return expanded blog with manual relation fetching
        const concepts = await prisma.concept.findMany({
            where: { id: { in: blog.conceptIds } },
        });
        const relatedBlogs = await prisma.blogPost.findMany({
            where: { id: { in: blog.relatedIds } },
        });
        return res.status(201).json({
            ...blog,
            concepts,
            related: relatedBlogs,
        });
    }
    catch (err) {
        console.error("createBlog error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
//# sourceMappingURL=blog.controller.js.map