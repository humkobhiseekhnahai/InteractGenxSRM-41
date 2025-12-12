export declare const findBlogDetails: (id: string) => Promise<{
    concepts: {
        id: string;
        name: string;
        slug: string | null;
        blogPostIds: string[];
        relatedIds: string[];
        embedding: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
    }[];
    related: {
        id: string;
        slug: string | null;
        relatedIds: string[];
        embedding: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        title: string;
        content: string;
        excerpt: string | null;
        conceptIds: string[];
    }[];
    id: string;
    slug: string | null;
    relatedIds: string[];
    embedding: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
    title: string;
    content: string;
    excerpt: string | null;
    conceptIds: string[];
} | null>;
//# sourceMappingURL=blog.service.d.ts.map