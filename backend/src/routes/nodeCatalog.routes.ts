import { Router } from "express";
import {
  getNodeConfigSchemas,
  getNodeTypes,
} from "../controllers/nodeCatalog.controller";

const router = Router();

router.get("/types", getNodeTypes);
router.get("/schemas", getNodeConfigSchemas);

export default router;
