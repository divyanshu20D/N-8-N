import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validation.middleware";
import {
  validateLoginBody,
  validateRegisterBody,
} from "../validators/auth.validator";
import { createRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();
const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const authRateLimiter = createRateLimiter(() => ({
  windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
  maxRequests: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 30),
  keyPrefix: "auth",
}));

router.post(
  "/register",
  authRateLimiter,
  validateBody(validateRegisterBody),
  register,
);
router.post("/login", authRateLimiter, validateBody(validateLoginBody), login);

export default router;
