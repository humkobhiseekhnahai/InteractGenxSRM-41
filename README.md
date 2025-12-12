InteractGenxSRM-45 — Semantic Graph Backend

Project: Semantic, graph-powered blogging backend (TypeScript, Prisma, MongoDB, Gemini embeddings)

⸻

Table of contents
	•	Overview
	•	Architecture (diagram)
	•	File structure (canonical)
	•	Environment (.env) example
	•	Install & run locally (step-by-step)
	•	Prisma / DB / Docker notes
	•	Available scripts (package.json)
	•	API Reference (endpoints, request/response examples)
	•	Seed & embeddings generation
	•	Troubleshooting & tips
	•	License / Credits

⸻

Overview

This backend stores blog posts and concepts in a graph-like structure and powers semantic search and relationships using vector embeddings (Gemini). It provides APIs to create content, run semantic search, and return graph-ready data that can be consumed by a React front-end (graph UI).

Key features:
	•	Blog & Concept storage (MongoDB + Prisma)
	•	Embeddings generation (Google Gemini)
	•	Semantic search (cosine similarity)
	•	Auto-tagging: new blog → auto-assign concepts
	•	Auto-related linking: new blog → auto-link similar blogs
	•	Graph endpoints for frontend navigation
	•	TypeScript + Prisma + Docker-friendly

⸻

Architecture

flowchart LR
  User[User / Frontend]
  subgraph Frontend
    UI[Graph UI (React + Tailwind)]
  end
  User --> UI
  UI -->|HTTP/REST| API[Express API (TypeScript)]
  API -->|Prisma| Mongo[(MongoDB Replica Set)]
  API -->|Gemini Embeddings & LLM| Gemini[Google Gemini API]
  Mongo -->|store| VectorStorage[embeddings (Json arrays)]

Notes:
	•	The API generates embeddings via Gemini and stores vectors in MongoDB as JSON arrays.
	•	Similarity is computed server-side (cosine similarity).

⸻

File structure (canonical)

package.json
tsconfig.json
docker-compose.yml
.env.example
prisma/schema.prisma
src/
  controllers/
    blog.controller.ts
    concept.controller.ts
    search.controller.ts
    graph.controller.ts
  routes/
    blog.routes.ts
    concept.routes.ts
    search.routes.ts
    graph.routes.ts
  seed/
    seed.ts
    generateEmbeddings.ts
  utils/
    prisma.ts
    embeddings.ts
    similarity.ts
  server.ts
  app.ts

Note: include tsconfig.json in repo (example below).

⸻

.env.example

# Server
PORT=4000

# MongoDB (local replica set)
DATABASE_URL="mongodb://localhost:27017/semantic_graph_db?replicaSet=rs0"

# Gemini (Google Generative AI) API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI key if you also support OpenAI
# OPENAI_API_KEY=

# Prisma (if using env-driven config)
# PRISMA_CLIENT_ENGINE_TYPE=binary

Save a copy as .env and populate keys.

⸻

tsconfig.json (recommended)

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}


⸻

Docker Compose (Mongo single-node replica set)

Use this docker-compose.yml (we recommend host.docker.internal / localhost approach for macOS):

version: "3.8"
services:
  mongo:
    container_name: semantic-mongo
    image: mongo:6
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    entrypoint:
      - /bin/bash
      - -c
      - |
        mongod --replSet rs0 --bind_ip_all &
        sleep 5
        mongosh --eval "rs.initiate({_id: 'rs0', members:[{_id:0, host:'localhost:27017'}]})" || true
        tail -f /dev/null

volumes:
  mongo-data:

Start with:

docker compose up -d

Then verify replica set:

docker exec -it semantic-mongo mongosh --eval "rs.status()"


⸻

Install & Run Locally
	1.	Clone the repo

git clone <repo-url>
cd repo

	2.	Create .env from .env.example and set keys
	3.	Start MongoDB replica set using Docker (see docker-compose above):

docker compose up -d

	4.	Install dependencies:

npm install

	5.	Generate Prisma client & push schema

npx prisma generate
npx prisma db push

	6.	Build (compile TypeScript) or run dev:

	•	Dev (hot-reload using ts-node + nodemon):

npm run dev

	•	Build & run:

npm run build
npm start

	7.	Seed data (optional) and generate embeddings:

npm run seed    # runs seed.ts
npm run embed   # compiles and runs generateEmbeddings

Server listens by default on http://localhost:4000

⸻

package.json — Important scripts (example)

{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/server.ts",
    "build": "tsc -b",
    "start": "tsc -b && node dist/server.js",
    "seed": "npm run build && node dist/seed/seed.js",
    "embed": "npm run build && node dist/seed/generateEmbeddings.js"
  }
}


⸻

Prisma (schema notes)
	•	BlogPost.embedding and Concept.embedding are Json? fields (store arrays of numbers)
	•	Relations are manual arrays: conceptIds, relatedIds, blogPostIds — Prisma MongoDB does not support relational include
	•	Use manual findMany queries to fetch related objects by ids

⸻

API REFERENCE

Base URL: http://localhost:4000

1) GET /concepts
	•	Description: List all concepts
	•	Request: GET
	•	Response: 200 OK JSON array of concepts

Example response:

[
  {
    "id": "693beeb9...",
    "name": "Cryptography",
    "slug": "cryptography",
    "blogPostIds": ["693beeb9..."],
    "relatedIds": ["693beeb9..."],
    "embedding": null,
    "createdAt": "2025-12-12T...Z"
  }
]


⸻

2) GET /concepts/:id
	•	Description: Get a single concept and optionally its blogs
	•	Request: GET /concepts/:id
	•	Response: 200 OK concept object

Example response contains fields above.

⸻

3) GET /blogs/:id
	•	Description: Fetch a blog by ID. Returns blog fields + expanded concepts and related arrays (manually fetched)
	•	Request: GET /blogs/:id
	•	Response: 200 OK

Example response:

{
  "id": "693beeb9...",
  "title": "AI in Cybersecurity",
  "slug": "ai-in-security",
  "content": "...",
  "excerpt": "...",
  "conceptIds": ["693beeb9..."],
  "relatedIds": ["693beeb9..."],
  "embedding": [0.0123, -0.0234, ...],
  "createdAt": "2025-12-12T...Z",
  "concepts": [ /* concept objects fetched by id */ ],
  "related": [ /* related blog objects fetched by id */ ]
}


⸻

4) POST /blogs
	•	Description: Create a new blog. Auto-tagging and auto-related linking are applied.
	•	Request: POST with JSON body

{
  "title": "Quantum Encryption",
  "slug": "quantum-encryption",   // optional
  "content": "Quantum cryptography...",
  "excerpt": "Short excerpt..."
}

	•	Behavior: Server will
	1.	generate embedding via Gemini
	2.	compare against concept embeddings → auto-tag (or create new concept)
	3.	compare against existing blog embeddings → pick top-N related blogs and update both sides
	4.	persist blog, update concept.blogPostIds and relatedIds
	•	Response: 201 Created with created blog and concepts array.

Example response:

{
  "blog": { ... },
  "concepts": [ ... ]
}


⸻

5) GET /search?q=your+query
	•	Description: Semantic search endpoint.
	•	Request: GET /search?q=cryptography
	•	Behavior:
	1.	generate embedding for query
	2.	compute cosine similarity vs blog embeddings
	3.	return ranked results
	•	Response: 200 OK JSON

Example response:

{
  "query": "cryptography",
  "results": [
    { "id": "693beeb9...", "title": "Intro to Crypto", "score": 0.82, "embedding": [...] },
    { "id": "693beeb9...", "title": "How Encryption Works", "score": 0.52 }
  ]
}


⸻

6) GET /graph?node=cryptography  (Graph API)
	•	Description: Return graph-ready data (concept nodes, blog nodes, and edges) centered on a node name or id.
	•	Request: GET /graph?node=cryptography or GET /graph?id=693beeb9...
	•	Response:

{
  "center": { "id": "693...", "type": "concept", "name": "Cryptography" },
  "nodes": [ /* concepts + blogs */ ],
  "edges": [ { "from": "cryptography", "to": "encryption", "weight": 0.71 }, ... ]
}

This is designed for direct consumption by the frontend graph renderer.

⸻

7) GET /graph/expand?id=... (Node expansion)
	•	Description: Expand a graph node (concept or blog) and return neighbors (concepts and blogs) and weighted edges.
	•	Request: GET /graph/expand?id=693beeb9...
	•	Response: similar to /graph but limited to nearby nodes

⸻

8) GET /concepts/:id/explain (AI explanation)
	•	Description: Return a short, Gemini-generated explanation of the concept and its relations
	•	Behavior: Server composes a prompt (concept + neighbors) → calls Gemini LLM → returns text
	•	Response:

{ "explanation": "Cryptography is ... and is connected to AI because ..." }


⸻

Seed & Embeddings
	•	src/seed/seed.ts inserts example concepts & blogs (IDs change on each run).
	•	src/seed/generateEmbeddings.ts reads blogs and calls generateEmbedding() (Gemini) and stores result in blog.embedding.

Run:

npm run seed
npm run embed

After embed, blog.embedding and concept.embedding will be populated.

⸻

Troubleshooting
	•	Cannot connect to Mongo / Replica set errors: ensure docker compose started, check rs.status() inside container, re-initiate with localhost:27017 if needed.
	•	Prisma errors about relations: remember, Mongo connector doesn’t support include for relations; fetch related objects manually by findMany({ where: { id: { in: [...] } } }).
	•	generateEmbeddings returns empty or 0-length vector: check GEMINI_API_KEY in .env and network connectivity.
	•	CORS / 404 / Cannot GET: ensure router is mounted (e.g. app.use('/search', searchRouter) or app.use('/', router)).

⸻

Example cURL snippets
	•	Get concepts:

curl http://localhost:4000/concepts

	•	Get a blog (sample ID from seed):

curl http://localhost:4000/blogs/693beeb9e605a837d722d06f

	•	Create a blog:

curl -X POST http://localhost:4000/blogs \
  -H "Content-Type: application/json" \
  -d '{"title":"Quantum Encryption","content":"..."}'

	•	Semantic search:

curl "http://localhost:4000/search?q=cryptography"


⸻

Final notes / demo tips (for hackathon)
	•	Demo flow idea:
	1.	Show concept graph landing page
	2.	Click a concept (Cryptography) → open blog list
	3.	Click a blog → show content + related nodes animate in
	4.	Use search bar (“quantum” or “ai security”) → highlight correct node
	5.	Create a new blog live (optional): show auto-tagging & auto-linking
	6.	Click “Explain” on a concept → show LLM generated explanation
	•	Keep your .env and API keys private.

⸻

License / Credits

MIT

⸻

If you want, I can also:
	•	generate a README.pdf or slides for the demo
	•	produce a short 2-minute pitch script and slide outline
	•	produce the frontend skeleton (React + Tailwind + react-force-graph) ready to paste

Tell me which next deliverable you want.
