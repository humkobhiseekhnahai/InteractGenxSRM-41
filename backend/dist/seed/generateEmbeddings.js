import prisma from "../utils/prisma.js";
import { generateEmbedding } from "../utils/embeddings.js";
async function main() {
    console.log("🔍 Generating embeddings for all blog posts...");
    const posts = await prisma.blogPost.findMany();
    for (const post of posts) {
        const text = `${post.title}\n${post.content}`;
        const vector = await generateEmbedding(text);
        await prisma.blogPost.update({
            where: { id: post.id },
            data: { embedding: vector },
        });
        console.log(`✔ Updated embedding for: ${post.title}`);
    }
    console.log("✨ All embeddings generated successfully!");
}
main()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=generateEmbeddings.js.map