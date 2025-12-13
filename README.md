
# **InteractGenX – Local Setup Guide**

  

This guide explains how to set up and run **InteractGenX** locally on your machine.

  

The project consists of:

-   **Backend**: Node.js + Express + Prisma + PostgreSQL
    
-   **Frontend**: React (Vite) + TypeScript + Tailwind + Framer Motion
    

----------

## **Prerequisites**

  

Make sure you have the following installed:

-   **Node.js** v18 or later
    
-   **npm** (comes with Node.js)
    
-   **MongoDb** (local or Docker)
    
-   **Git**
    

  

Optional but recommended:

-   Docker & Docker Compose

----------

## **1. Clone the Repository**

```
git clone <your-repo-url>
cd InteractGenX
```

Project structure:

```
InteractGenX/
├── backend/
└── frontend/
```

----------

## **2. Backend Setup**

  

### **2.1 Install Dependencies**

```
cd backend
npm install
```

----------

### **2.2 Environment Variables**

  

Create a .env file inside backend/:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/interactgenx"
PORT=3001
```

Replace:

-   USER → your Postgres username
    
-   PASSWORD → your Postgres password
    

----------

### **2.3 Prisma Setup**

  

Generate Prisma client:

```
npx prisma generate
```

Push schema to MongoDB (no migrations for MongoDB):

```
npx prisma db push
```

----------

### **2.4 Seed the Database**

  

Populate the database with concepts, blogs, and relations:

```
npm run seed
```

You should see logs like:

```
✔ 20 concepts created
✔ 80+ blogs created
✔ Relations created
```

----------

### **2.5 (Optional) Generate Embeddings**

  

If semantic search is enabled:

```
npm run embed
```

----------

### **2.6 Start Backend Server**

```
npm run dev
```

Backend will run on:

```
http://localhost:4000
```

----------

## **3. Frontend Setup**

  

### **3.1 Install Dependencies**

```
cd ../frontend
npm install
```

----------

### **3.3 Start Frontend**

```
npm run dev
```

Frontend will be available at:

```
http://localhost:3000
```

----------

## **4. Using the App**

  

### **Knowledge Graph**

-   Concepts appear at the center
    
-   Blogs orbit around related concepts
    
-   Click a **concept** → expands graph
    
-   Click a **blog** → opens blog modal
    

  

### **Command Palette**

-   Press **⌘ + K** / **Ctrl + K**
    
-   Search concepts or blogs
    
-   Select a result to focus the node in the graph
    

  

### **Navigation**

-   Drag to pan
    
-   Scroll to zoom
    
-   Back button restores previous graph state
    

----------

## **5. Common Issues**

  

### **Database not updating after seed**

```
npx prisma db push
npm run seed
```

```
---

### Command Palette shows no results

- Ensure `npm run embed` was executed
- Confirm embeddings exist in database

---

### Graph not centering / jumping

- Ensure backend `/graph` endpoint is running
- Check browser console for API errors

---

## 6. Useful Commands

### Backend

```bash
npm run dev       # start backend
npm run seed      # seed database
npm run embed     # generate embeddings
```

### **Frontend**

```
npm run dev       # start frontend
npm run build     # production build
```

----------

## **7. Tech Stack Summary**

  

**Frontend**

-   React + TypeScript
    
-   Vite
    
-   Tailwind CSS
    
-   Framer Motion
    
-   react-force-graph
    

  

**Backend**

-   Node.js + Express
    
-   Prisma ORM
    
-   MongoDb
    
-   Gemini (embeddings)
    