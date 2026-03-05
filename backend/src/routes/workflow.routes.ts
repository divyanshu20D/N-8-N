import { Router } from "express";
import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
  duplicateWorkflow,
} from "../controllers/workflow.controller";
import { protect } from "../middleware/auth.middleware";
import {
  validateBody,
  validateObjectIdParam,
} from "../middleware/validation.middleware";
import {
  validateCreateWorkflowBody,
  validateUpdateWorkflowBody,
} from "../validators/workflow.validator";

const router = Router();

router.use(protect);

router.post("/", validateBody(validateCreateWorkflowBody), createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", validateObjectIdParam("id"), getWorkflow);
router.put(
  "/:id",
  validateObjectIdParam("id"),
  validateBody(validateUpdateWorkflowBody),
  updateWorkflow,
);
router.delete("/:id", validateObjectIdParam("id"), deleteWorkflow);
router.post("/:id/duplicate", validateObjectIdParam("id"), duplicateWorkflow);
router.post("/:id/run", validateObjectIdParam("id"), runWorkflow);

export default router;
