/**
 * Static registry of available node types.
 *
 * This is used by the NodePalette to show what nodes are available
 * and by the canvas to render nodes with the right icons/colors.
 *
 * Later, this could come from the backend API instead.
 */

import type { NodeTypeDefinition } from "../types/workflow";

export const NODE_TYPES: NodeTypeDefinition[] = [
  // ─── Triggers ─────────────────────────────────
  {
    type: "manual-trigger",
    category: "trigger",
    name: "Manual Trigger",
    description: "Start the workflow manually with the Execute button",
    icon: "Play",
    color: "#34d399", // Green
    inputs: 0,
    outputs: 1,
  },
  {
    type: "schedule-trigger",
    category: "trigger",
    name: "Schedule Trigger",
    description: "Run the workflow on a recurring schedule (cron)",
    icon: "Clock",
    color: "#fbbf24", // Amber
    inputs: 0,
    outputs: 1,
  },
  {
    type: "webhook-trigger",
    category: "trigger",
    name: "Webhook Trigger",
    description: "Start workflow when an HTTP request is received",
    icon: "Webhook",
    color: "#a78bfa", // Purple
    inputs: 0,
    outputs: 1,
  },

  // ─── Actions ──────────────────────────────────
  {
    type: "http-request",
    category: "action",
    name: "HTTP Request",
    description: "Make HTTP requests to external APIs",
    icon: "Globe",
    color: "#60a5fa", // Blue
    inputs: 1,
    outputs: 1,
  },
  {
    type: "discord",
    category: "action",
    name: "Discord",
    description: "Send messages to Discord channels via webhook",
    icon: "MessageSquare",
    color: "#818cf8", // Indigo
    inputs: 1,
    outputs: 1,
  },
  {
    type: "email",
    category: "action",
    name: "Email (SMTP)",
    description: "Send emails using SMTP",
    icon: "Mail",
    color: "#fb923c", // Orange
    inputs: 1,
    outputs: 1,
  },
  {
    type: "telegram",
    category: "action",
    name: "Telegram",
    description: "Send messages via Telegram Bot API",
    icon: "Send",
    color: "#38bdf8", // Sky
    inputs: 1,
    outputs: 1,
  },
  {
    type: "weather",
    category: "action",
    name: "Weather",
    description: "Fetch weather data from OpenWeatherMap",
    icon: "CloudSun",
    color: "#2dd4bf", // Teal
    inputs: 1,
    outputs: 1,
  },

  // ─── Utilities ────────────────────────────────
  {
    type: "transform",
    category: "utility",
    name: "Transform",
    description: "Transform and reshape data between nodes",
    icon: "Shuffle",
    color: "#e879f9", // Fuchsia
    inputs: 1,
    outputs: 1,
  },
  {
    type: "conditional",
    category: "utility",
    name: "IF",
    description: "Route data based on conditions (true/false branches)",
    icon: "GitBranch",
    color: "#f472b6", // Pink
    inputs: 1,
    outputs: 2, // true & false branches
  },
];

/**
 * Quick lookup map: type → NodeTypeDefinition
 */
export const NODE_TYPE_MAP = new Map<string, NodeTypeDefinition>(
  NODE_TYPES.map((n) => [n.type, n]),
);

/**
 * Get a node type definition by its type string.
 */
export function getNodeType(type: string): NodeTypeDefinition | undefined {
  return NODE_TYPE_MAP.get(type);
}
