import prisma from "../utils/prisma.js";
export const findBlogDetails = async (id) => {
    const blog = await prisma.blogPost.findUnique({ where: { id } });
    if (!blog)
        return null;
    const relatedBlogs = await prisma.blogPost.findMany({
        where: { id: { in: blog.relatedIds } }
    });
    const concepts = await prisma.concept.findMany({
        where: { id: { in: blog.conceptIds } }
    });
    return {
        ...blog,
        concepts,
        related: relatedBlogs
    };
};
//# sourceMappingURL=blog.service.js.map