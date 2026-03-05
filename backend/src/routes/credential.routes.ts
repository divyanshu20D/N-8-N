import { Router } from "express";
import {
  createCredential,
  deleteCredential,
  getCredential,
  getCredentials,
  testCredential,
  updateCredential,
} from "../controllers/credential.controller";
import { protect } from "../middleware/auth.middleware";
import {
  validateBody,
  validateObjectIdParam,
} from "../middleware/validation.middleware";
import {
  validateCreateCredentialBody,
  validateUpdateCredentialBody,
} from "../validators/credential.validator";

const router = Router();

router.use(protect);

router.post("/", validateBody(validateCreateCredentialBody), createCredential);
router.get("/", getCredentials);
router.get("/:id", validateObjectIdParam("id"), getCredential);
router.put(
  "/:id",
  validateObjectIdParam("id"),
  validateBody(validateUpdateCredentialBody),
  updateCredential,
);
router.delete("/:id", validateObjectIdParam("id"), deleteCredential);
router.post("/:id/test", validateObjectIdParam("id"), testCredential);

export default router;
