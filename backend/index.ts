import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db";
import authRoutes from "./src/routes/auth.routes";
import workflowRoutes from "./src/routes/workflow.routes";
import nodeCatalogRoutes from "./src/routes/nodeCatalog.routes";
import credentialRoutes from "./src/routes/credential.routes";
import executionRoutes from "./src/routes/execution.routes";
import triggerRoutes from "./src/routes/trigger.routes";
import { initializeTriggerInfrastructure } from "./src/services/trigger.service";
import { sendError } from "./src/utils/errorResponse";
import { securityHeaders } from "./src/middleware/securityHeaders.middleware";
import { requestLifecycle } from "./src/middleware/requestLifecycle.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "50mb";
const REQUEST_TIMEOUT_MS = parsePositiveInt(
  process.env.REQUEST_TIMEOUT_MS,
  30_000,
);

app.disable("x-powered-by");
app.use(cors());
app.use(securityHeaders);
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(requestLifecycle({ requestTimeoutMs: REQUEST_TIMEOUT_MS }));

app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/nodes", nodeCatalogRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/executions", executionRoutes);
app.use("/api/triggers", triggerRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((req: Request, res: Response) => {
  console.error(`[ROUTE_NOT_FOUND] ${req.method} ${req.originalUrl}`);
  sendError(res, 404, {
    code: "ROUTE_NOT_FOUND",
    message: "Route not found",
  });
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : String(error);
  console.error(
    `[UNHANDLED_ERROR] ${req.method} ${req.originalUrl} - ${message}`,
  );
  console.error(stack);
  if (res.headersSent) return;
  sendError(res, 500, {
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
});

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT_EXCEPTION]", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED_REJECTION]", reason);
});

const startServer = async () => {
  await connectDB();
  await initializeTriggerInfrastructure();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("[SERVER_STARTUP_ERROR]", error);
  process.exit(1);
});
