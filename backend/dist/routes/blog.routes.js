import { Router } from "express";
import { createBlog, getBlogById } from "../controllers/blog.controller.js";
const blogRouter = Router();
blogRouter.get("/:id", getBlogById);
blogRouter.post("/", createBlog);
export default blogRouter;
//# sourceMappingURL=blog.routes.js.map