# n8n-Clone Backend: Step-by-Step Plan

## Step 1 (Completed): Workflow Model Alignment + Node Catalog APIs
- Goal: Make backend workflow payload shape match frontend editor shape.
- Why: If backend shape differs from frontend shape, integration becomes brittle and full of field mapping bugs.
- Added:
  - Workflow fields aligned to frontend:
    - `active` (instead of `isActive`)
    - `connections` (instead of `edges`)
    - node fields `config` and optional `label`
  - Workflow duplicate API: `POST /api/workflows/:id/duplicate`
  - Node metadata APIs:
    - `GET /api/nodes/types`
    - `GET /api/nodes/schemas`

### Step 1 Test Checklist
1. Compile check:
   - `bunx tsc --noEmit`
2. Start backend:
   - `bun run index.ts`
3. API checks:
   - `GET /api/nodes/types`
   - `GET /api/nodes/schemas`
   - `POST /api/workflows` (auth required)
   - `POST /api/workflows/:id/duplicate` (auth required)

---

## Step 2 (Completed): Credentials Module
- Added credential model + user scoped storage.
- Added encrypted secret storage at rest (`CRYPTO_SECRET`).
- Added credential APIs:
  - `POST /api/credentials`
  - `GET /api/credentials`
  - `GET /api/credentials/:id`
  - `PUT /api/credentials/:id`
  - `DELETE /api/credentials/:id`
  - `POST /api/credentials/:id/test`
- Added provider-aware credential test support for:
  - `discord` (webhook URL)
  - `telegram` (bot token + chat id)
  - `weather` (OpenWeather API key)

### Step 2 Test Checklist
1. Compile check:
   - `bunx tsc --noEmit`
2. Start backend:
   - `bun run index.ts`
3. API checks (auth required):
   - `POST /api/credentials`
   - `GET /api/credentials`
   - `POST /api/credentials/:id/test`

## Step 3 (Completed): Executions History Module
- Added `Execution` model with:
  - workflow/user references
  - status (`queued`, `running`, `success`, `failed`, `cancelled`)
  - trigger type (`manual`, `webhook`, `schedule`)
  - timing fields and error summary
  - node-level execution logs
- Updated workflow run flow (`POST /api/workflows/:id/run`) to:
  - create execution row at start
  - persist success output + node logs on completion
  - mark failed with error summary on runtime error
- Added execution APIs:
  - `GET /api/executions` (supports `workflowId`, `status`, `page`, `limit`)
  - `GET /api/executions/:id`

### Step 3 Test Checklist
1. Compile check:
   - `bunx tsc --noEmit`
2. Start backend:
   - `bun run index.ts`
3. API checks (auth required):
   - Run workflow: `POST /api/workflows/:id/run`
   - List executions: `GET /api/executions`
   - Filter executions:
     - `GET /api/executions?workflowId=<id>`
     - `GET /api/executions?status=failed`
   - Execution detail: `GET /api/executions/:id`

## Step 4 (Completed): Trigger Infrastructure
- Added webhook trigger endpoint:
  - `ALL /api/triggers/webhook/:workflowId/:nodeId`
  - Validates node type, expected HTTP method, and optional auth token.
  - Starts workflow execution with `triggerType: webhook`.
- Added schedule trigger infrastructure:
  - Node-cron based scheduler bootstrap at server startup.
  - Registers active workflow `schedule-trigger` nodes.
  - Automatically syncs schedule tasks when workflows are created, updated, duplicated, or deleted.
  - Starts workflow execution with `triggerType: schedule`.
- Refactored run orchestration into shared workflow runner service:
  - Manual + webhook + schedule now all persist executions consistently.

### Step 4 Test Checklist
1. Compile check:
   - `bunx tsc --noEmit`
2. Start backend:
   - `bun run index.ts`
3. Webhook checks:
   - Create workflow with `webhook-trigger` node id.
   - Call:
     - `POST /api/triggers/webhook/<workflowId>/<nodeId>`
   - Optional token:
     - Header `x-webhook-token: <token>`
     - or `Authorization: Bearer <token>`
     - or query `?token=<token>`
4. Schedule checks:
   - Create/update active workflow with `schedule-trigger` + valid `cronExpression`.
   - Wait for cron tick and verify:
     - `GET /api/executions` shows `triggerType=schedule`.

## Step 5: Settings + Global Variables + Templates
- Settings APIs.
- Global variables APIs.
- Marketplace template APIs.

## Step 6: Hardening
- Validation schemas, consistent error envelopes, rate limiting, request logging.
