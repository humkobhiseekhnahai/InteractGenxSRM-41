export declare const findAllConcepts: () => Promise<{
    id: string;
    name: string;
    slug: string | null;
    blogPostIds: string[];
    relatedIds: string[];
    embedding: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
}[]>;
export declare const findConceptDetails: (id: string) => Promise<{
    blogs: {
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
    related: {
        id: string;
        name: string;
        slug: string | null;
        blogPostIds: string[];
        relatedIds: string[];
        embedding: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
    }[];
    id: string;
    name: string;
    slug: string | null;
    blogPostIds: string[];
    relatedIds: string[];
    embedding: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
} | null>;
//# sourceMappingURL=concept.service.d.ts.map