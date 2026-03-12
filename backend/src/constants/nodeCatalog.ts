export type NodeCategory = "trigger" | "action" | "utility";

export interface NodeTypeDefinition {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  inputs: number;
  outputs: number;
}

export interface ConfigFieldOption {
  label: string;
  value: string;
}

export interface ConfigFieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "checkbox" | "credential";
  placeholder?: string;
  options?: ConfigFieldOption[];
  required?: boolean;
  defaultValue?: unknown;
}

export const NODE_TYPES: NodeTypeDefinition[] = [
  {
    type: "manual-trigger",
    category: "trigger",
    name: "Manual Trigger",
    description: "Start the workflow manually with the Execute button",
    icon: "Play",
    color: "#34d399",
    inputs: 0,
    outputs: 1,
  },
  {
    type: "schedule-trigger",
    category: "trigger",
    name: "Schedule Trigger",
    description: "Run the workflow on a recurring schedule (cron)",
    icon: "Clock",
    color: "#fbbf24",
    inputs: 0,
    outputs: 1,
  },
  {
    type: "webhook-trigger",
    category: "trigger",
    name: "Webhook Trigger",
    description: "Start workflow when an HTTP request is received",
    icon: "Webhook",
    color: "#a78bfa",
    inputs: 0,
    outputs: 1,
  },
  {
    type: "incident-trigger",
    category: "action",
    name: "Incident Trigger",
    description: "Create or update a correlated incident from workflow data",
    icon: "Siren",
    color: "#f97316",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "signal-check",
    category: "action",
    name: "Signal Check",
    description: "Fetch or read a system metric and normalize it for incident workflows",
    icon: "Activity",
    color: "#06b6d4",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "severity-rule",
    category: "utility",
    name: "Severity Rule",
    description: "Evaluate a numeric signal and assign warning/high/critical severity",
    icon: "Gauge",
    color: "#ef4444",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "http-request",
    category: "action",
    name: "HTTP Request",
    description: "Make HTTP requests to external APIs",
    icon: "Globe",
    color: "#60a5fa",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "discord",
    category: "action",
    name: "Discord",
    description: "Send messages to Discord channels via webhook",
    icon: "MessageSquare",
    color: "#818cf8",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "email",
    category: "action",
    name: "Email (SMTP)",
    description: "Send emails using SMTP",
    icon: "Mail",
    color: "#fb923c",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "telegram",
    category: "action",
    name: "Telegram",
    description: "Send messages via Telegram Bot API",
    icon: "Send",
    color: "#38bdf8",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "weather",
    category: "action",
    name: "Weather",
    description: "Fetch weather data from OpenWeatherMap",
    icon: "CloudSun",
    color: "#2dd4bf",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "transform",
    category: "utility",
    name: "Transform",
    description: "Transform and reshape data between nodes",
    icon: "Shuffle",
    color: "#e879f9",
    inputs: 1,
    outputs: 1,
  },
  {
    type: "conditional",
    category: "utility",
    name: "IF",
    description: "Route data based on conditions (true/false branches)",
    icon: "GitBranch",
    color: "#f472b6",
    inputs: 1,
    outputs: 2,
  },
];

export const NODE_CONFIG_SCHEMAS: Record<string, ConfigFieldDefinition[]> = {
  "manual-trigger": [],
  "schedule-trigger": [
    {
      key: "cronExpression",
      label: "Cron Expression",
      type: "text",
      placeholder: "*/5 * * * *",
      required: true,
    },
    {
      key: "missedPolicy",
      label: "Missed Execution Policy",
      type: "select",
      options: [
        { label: "Skip", value: "skip" },
        { label: "Run Once", value: "run-once" },
        { label: "Run All", value: "run-all" },
      ],
      defaultValue: "skip",
    },
  ],
  "webhook-trigger": [
    {
      key: "httpMethod",
      label: "HTTP Method",
      type: "select",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
      defaultValue: "POST",
    },
    {
      key: "authToken",
      label: "Auth Token (optional)",
      type: "text",
      placeholder: "Bearer token for validation",
    },
  ],
  "incident-trigger": [
    {
      key: "title",
      label: "Incident Title",
      type: "text",
      placeholder: "Checkout API error spike",
      required: true,
    },
    {
      key: "summary",
      label: "Summary",
      type: "textarea",
      placeholder: "Describe what seems to be happening",
    },
    {
      key: "severity",
      label: "Severity",
      type: "select",
      options: [
        { label: "Warning", value: "warning" },
        { label: "High", value: "high" },
        { label: "Critical", value: "critical" },
      ],
      defaultValue: "warning",
      required: true,
    },
    {
      key: "source",
      label: "Source",
      type: "text",
      placeholder: "workflow.manual",
      defaultValue: "workflow.manual",
      required: true,
    },
    {
      key: "service",
      label: "Service",
      type: "text",
      placeholder: "checkout-api",
    },
    {
      key: "environment",
      label: "Environment",
      type: "text",
      placeholder: "staging",
    },
    {
      key: "dedupeKey",
      label: "Dedupe Key",
      type: "text",
      placeholder: "checkout-api:staging:500-spike",
    },
    {
      key: "symptoms",
      label: "Symptoms (comma separated)",
      type: "textarea",
      placeholder: "500 spike, latency increase, queue backlog",
    },
  ],
  "signal-check": [
    {
      key: "signalName",
      label: "Signal Name",
      type: "text",
      placeholder: "API error rate",
      required: true,
    },
    {
      key: "sourceType",
      label: "Source Type",
      type: "select",
      options: [
        { label: "HTTP Endpoint", value: "http" },
        { label: "Workflow Context", value: "context" },
      ],
      defaultValue: "http",
      required: true,
    },
    {
      key: "url",
      label: "URL",
      type: "text",
      placeholder: "https://staging.example.com/health/errors",
    },
    {
      key: "method",
      label: "Method",
      type: "select",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
      ],
      defaultValue: "GET",
    },
    {
      key: "metricField",
      label: "Metric Field",
      type: "text",
      placeholder: "errorRate",
      required: true,
    },
    {
      key: "metricKey",
      label: "Metric Key",
      type: "text",
      placeholder: "errorRate",
      required: true,
    },
    {
      key: "fallbackValue",
      label: "Fallback Value",
      type: "number",
      defaultValue: 0,
    },
    {
      key: "source",
      label: "Source Label",
      type: "text",
      placeholder: "signal-check.http",
      defaultValue: "signal-check.http",
    },
    {
      key: "service",
      label: "Service",
      type: "text",
      placeholder: "checkout-api",
    },
    {
      key: "environment",
      label: "Environment",
      type: "text",
      placeholder: "staging",
    },
    {
      key: "symptoms",
      label: "Symptoms (comma separated)",
      type: "textarea",
      placeholder: "500 spike, latency increase",
    },
  ],
  "severity-rule": [
    {
      key: "label",
      label: "Rule Label",
      type: "text",
      placeholder: "API error rate",
      required: true,
    },
    {
      key: "metricField",
      label: "Metric Field",
      type: "text",
      placeholder: "errorRate",
      required: true,
    },
    {
      key: "comparison",
      label: "Comparison",
      type: "select",
      options: [
        { label: "Greater Than", value: "gt" },
        { label: "Greater Than or Equal", value: "gte" },
        { label: "Less Than", value: "lt" },
        { label: "Less Than or Equal", value: "lte" },
      ],
      defaultValue: "gte",
      required: true,
    },
    {
      key: "warningThreshold",
      label: "Warning Threshold",
      type: "number",
      required: true,
      defaultValue: 1,
    },
    {
      key: "highThreshold",
      label: "High Threshold",
      type: "number",
      required: true,
      defaultValue: 5,
    },
    {
      key: "criticalThreshold",
      label: "Critical Threshold",
      type: "number",
      required: true,
      defaultValue: 10,
    },
    {
      key: "fallbackValue",
      label: "Fallback Value",
      type: "number",
      defaultValue: 0,
    },
  ],
  "http-request": [
    {
      key: "method",
      label: "Method",
      type: "select",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "PATCH", value: "PATCH" },
        { label: "DELETE", value: "DELETE" },
      ],
      defaultValue: "GET",
      required: true,
    },
    {
      key: "url",
      label: "URL",
      type: "text",
      placeholder: "https://api.example.com/data",
      required: true,
    },
    {
      key: "headers",
      label: "Headers (JSON)",
      type: "textarea",
      placeholder: "{\"Content-Type\": \"application/json\"}",
    },
    {
      key: "body",
      label: "Request Body",
      type: "textarea",
      placeholder: "{\"key\": \"value\"}",
    },
    {
      key: "authType",
      label: "Authentication",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Basic Auth", value: "basic" },
        { label: "Bearer Token", value: "bearer" },
        { label: "API Key", value: "apikey" },
      ],
      defaultValue: "none",
    },
  ],
  discord: [
    {
      key: "credentialId",
      label: "Discord Credential",
      type: "credential",
      required: true,
    },
    {
      key: "message",
      label: "Message",
      type: "textarea",
      placeholder: "Hello from FlowForge!",
      required: true,
    },
    {
      key: "username",
      label: "Bot Username",
      type: "text",
      placeholder: "FlowForge Bot",
    },
  ],
  email: [
    { key: "to", label: "To", type: "text", required: true },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "body", label: "Body", type: "textarea", required: true },
    {
      key: "format",
      label: "Format",
      type: "select",
      options: [
        { label: "Plain Text", value: "text" },
        { label: "HTML", value: "html" },
      ],
      defaultValue: "text",
    },
  ],
  telegram: [
    {
      key: "credentialId",
      label: "Telegram Credential",
      type: "credential",
      required: true,
    },
    {
      key: "chatId",
      label: "Chat ID",
      type: "text",
      required: true,
    },
    {
      key: "message",
      label: "Message",
      type: "textarea",
      required: true,
    },
  ],
  weather: [
    {
      key: "credentialId",
      label: "Weather API Credential",
      type: "credential",
      required: true,
    },
    { key: "city", label: "City", type: "text", required: true },
    {
      key: "units",
      label: "Units",
      type: "select",
      options: [
        { label: "Metric (C)", value: "metric" },
        { label: "Imperial (F)", value: "imperial" },
      ],
      defaultValue: "metric",
    },
  ],
  transform: [
    {
      key: "operation",
      label: "Operation",
      type: "select",
      options: [
        { label: "JSON Path Extract", value: "jsonpath" },
        { label: "String Replace", value: "replace" },
        { label: "Type Convert", value: "convert" },
      ],
      defaultValue: "jsonpath",
    },
    {
      key: "expression",
      label: "Expression",
      type: "text",
      placeholder: "$.data.items[0].name",
    },
  ],
  conditional: [
    { key: "field", label: "Field", type: "text", required: true },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      options: [
        { label: "Equals", value: "eq" },
        { label: "Not Equals", value: "neq" },
        { label: "Greater Than", value: "gt" },
        { label: "Less Than", value: "lt" },
        { label: "Contains", value: "contains" },
      ],
      defaultValue: "eq",
      required: true,
    },
    { key: "value", label: "Value", type: "text", required: true },
  ],
};
