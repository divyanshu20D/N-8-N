export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "checkbox" | "credential";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  defaultValue?: unknown;
}

export const NODE_CONFIG_SCHEMAS: Record<string, ConfigField[]> = {
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
      placeholder: '{"Content-Type": "application/json"}',
    },
    {
      key: "body",
      label: "Request Body",
      type: "textarea",
      placeholder: '{"key": "value"}',
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
    {
      key: "to",
      label: "To",
      type: "text",
      placeholder: "recipient@example.com",
      required: true,
    },
    {
      key: "subject",
      label: "Subject",
      type: "text",
      placeholder: "Email subject",
      required: true,
    },
    {
      key: "body",
      label: "Body",
      type: "textarea",
      placeholder: "Email body content",
      required: true,
    },
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
      placeholder: "123456789",
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
      key: "parseMode",
      label: "Parse Mode",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Markdown", value: "Markdown" },
        { label: "HTML", value: "HTML" },
      ],
      defaultValue: "none",
    },
  ],

  weather: [
    {
      key: "credentialId",
      label: "Weather API Credential",
      type: "credential",
      required: true,
    },
    {
      key: "city",
      label: "City",
      type: "text",
      placeholder: "London",
      required: true,
    },
    {
      key: "units",
      label: "Units",
      type: "select",
      options: [
        { label: "Metric (°C)", value: "metric" },
        { label: "Imperial (°F)", value: "imperial" },
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
    {
      key: "field",
      label: "Field",
      type: "text",
      placeholder: "{{$node.previous.output.value}}",
      required: true,
    },
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
    {
      key: "value",
      label: "Value",
      type: "text",
      placeholder: "comparison value",
      required: true,
    },
  ],
};
