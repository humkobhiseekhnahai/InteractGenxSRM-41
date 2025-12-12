import prisma from "../utils/prisma.js";
export const findAllConcepts = async () => {
    return prisma.concept.findMany();
};
export const findConceptDetails = async (id) => {
    const concept = await prisma.concept.findUnique({ where: { id } });
    if (!concept)
        return null;
    const blogPosts = await prisma.blogPost.findMany({
        where: { id: { in: concept.blogPostIds } }
    });
    const relatedConcepts = await prisma.concept.findMany({
        where: { id: { in: concept.relatedIds } }
    });
    return {
        ...concept,
        blogs: blogPosts,
        related: relatedConcepts
    };
};
//# sourceMappingURL=concept.service.js.map