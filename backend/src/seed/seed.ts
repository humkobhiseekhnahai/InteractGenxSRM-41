import prisma from "../utils/prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (optional)
  await prisma.blogPost.deleteMany({});
  await prisma.concept.deleteMany({});

  console.log("✔ Cleared old data");

  // Step 1: Create Concepts
  const cryptography = await prisma.concept.create({
    data: {
      name: "Cryptography",
      slug: "cryptography",
      blogPostIds: [],
      relatedIds: [],
    },
  });

  const security = await prisma.concept.create({
    data: {
      name: "Security",
      slug: "security",
      blogPostIds: [],
      relatedIds: [],
    },
  });

  const ai = await prisma.concept.create({
    data: {
      name: "Artificial Intelligence",
      slug: "ai",
      blogPostIds: [],
      relatedIds: [],
    },
  });

  console.log("✔ Concepts created");

  // Step 2: Create Blog Posts
  const blog1 = await prisma.blogPost.create({
    data: {
      title: "Introduction to Cryptography",
      slug: "intro-cryptography",
      content: "Cryptography is the science of secure communication...",
      excerpt: "Cryptography basics...",
      conceptIds: [cryptography.id],
      relatedIds: [],
      embedding: null, // we will fill this later when we add semantic search
    },
  });

  const blog2 = await prisma.blogPost.create({
    data: {
      title: "How Encryption Works",
      slug: "how-encryption-works",
      content: "Encryption protects data by converting it into unreadable form...",
      excerpt: "How modern encryption works...",
      conceptIds: [cryptography.id, security.id],
      relatedIds: [],
      embedding: null,
    },
  });

  const blog3 = await prisma.blogPost.create({
    data: {
      title: "AI in Cybersecurity",
      slug: "ai-in-security",
      content: "AI is revolutionizing intrusion detection and threat analysis...",
      excerpt: "AI's impact on modern security...",
      conceptIds: [ai.id, security.id],
      relatedIds: [],
      embedding: null,
    },
  });

  console.log("✔ BlogPosts created");

  // Step 3: Create Relations

  // Concept → BlogPost mapping
  await prisma.concept.update({
    where: { id: cryptography.id },
    data: { blogPostIds: { push: [blog1.id, blog2.id] } },
  });

  await prisma.concept.update({
    where: { id: security.id },
    data: { blogPostIds: { push: [blog2.id, blog3.id] } },
  });

  await prisma.concept.update({
    where: { id: ai.id },
    data: { blogPostIds: { push: [blog3.id] } },
  });

  // Related Concepts
  await prisma.concept.update({
    where: { id: cryptography.id },
    data: { relatedIds: { push: [security.id] } },
  });

  await prisma.concept.update({
    where: { id: security.id },
    data: { relatedIds: { push: [cryptography.id, ai.id] } },
  });

  await prisma.concept.update({
    where: { id: ai.id },
    data: { relatedIds: { push: [security.id] } },
  });

  // Related Blogs (semantic relations)
  await prisma.blogPost.update({
    where: { id: blog1.id },
    data: { relatedIds: { push: [blog2.id] } },
  });

  await prisma.blogPost.update({
    where: { id: blog2.id },
    data: { relatedIds: { push: [blog1.id, blog3.id] } },
  });

  await prisma.blogPost.update({
    where: { id: blog3.id },
    data: { relatedIds: { push: [blog2.id] } },
  });

  console.log("✔ Relations created");
  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });