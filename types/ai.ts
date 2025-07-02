export type AIServiceType = "openai" | "local" | "claude";

export type AIModelName = 
  | "gpt-3.5-turbo"
  | "gpt-4"
  | "gpt-4-32k";

export interface AIChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

export interface AIUsageStats {
  userId: string;
  totalCost: number;
  tokenCount: number;
  usageCount: number;
  lastUsedAt: Date;
}
