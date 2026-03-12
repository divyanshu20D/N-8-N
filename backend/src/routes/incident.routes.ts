import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getIncident,
  getIncidents,
  ingestIncident,
  remediationCheck,
} from "../controllers/incident.controller";

const router = Router();

router.use(protect);

router.get("/", getIncidents);
router.get("/:id", getIncident);
router.post("/ingest", ingestIncident);
router.post("/:id/remediation-check", remediationCheck);

export default router;
