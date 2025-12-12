import {} from "express";
import { findAllConcepts, findConceptDetails } from "../services/concept.service.js";
export const getAllConcepts = async (req, res) => {
    const concepts = await findAllConcepts();
    res.json(concepts);
};
export const getConceptById = async (req, res) => {
    const concept = await findConceptDetails(req.params.id);
    res.json(concept);
};
//# sourceMappingURL=concept.controller.js.map