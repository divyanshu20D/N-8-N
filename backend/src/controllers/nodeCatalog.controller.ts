import type { Request, Response } from "express";
import * as nodeCatalogService from "../services/nodeCatalog.service";

export const getNodeTypes = (_req: Request, res: Response) => {
  res.status(200).json(nodeCatalogService.getNodeTypes());
};

export const getNodeConfigSchemas = (_req: Request, res: Response) => {
  res.status(200).json(nodeCatalogService.getNodeConfigSchemas());
};
