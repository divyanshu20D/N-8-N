import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getExecution,
  getExecutions,
} from "../controllers/execution.controller";

const router = Router();

router.use(protect);

router.get("/", getExecutions);
router.get("/:id", getExecution);

export default router;
