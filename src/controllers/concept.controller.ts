import { type Request, type Response } from "express";
import { findAllConcepts, findConceptDetails } from "../services/concept.service.js";

export const getAllConcepts = async (req: Request, res: Response) => {
  const concepts = await findAllConcepts();
  res.json(concepts);
};

export const getConceptById = async (req: Request, res: Response) => {
  const concept = await findConceptDetails(req.params.id as string);
  res.json(concept);
};