import { Router } from "express";
import { handleWebhookTrigger } from "../controllers/trigger.controller";
import { createRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();
const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const webhookRateLimiter = createRateLimiter(() => ({
  windowMs: parsePositiveInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS, 60_000),
  maxRequests: parsePositiveInt(
    process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS,
    120,
  ),
  keyPrefix: "webhook",
}));

router.all("/webhook/:workflowId/:nodeId", webhookRateLimiter, handleWebhookTrigger);

export default router;
