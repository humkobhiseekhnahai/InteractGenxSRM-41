import express from "express";
import cors from "cors";
import conceptRouter from "./routes/concept.routes.js";
import blogRouter from "./routes/blog.routes.js";
import { search } from "./controllers/search.controller.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/concepts", conceptRouter);
app.use("/blogs", blogRouter);
app.use("/search", search);
export default app;
//# sourceMappingURL=app.js.map