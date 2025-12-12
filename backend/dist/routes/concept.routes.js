import { Router } from "express";
import { getAllConcepts, getConceptById } from "../controllers/concept.controller.js";
const conceptRouter = Router();
conceptRouter.get("/", getAllConcepts);
conceptRouter.get("/:id", getConceptById);
export default conceptRouter;
//# sourceMappingURL=concept.routes.js.map