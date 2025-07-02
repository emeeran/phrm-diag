import { AIModelName } from "@/types/ai";
import { TokenUsage } from "./ai-types";

// Cost per 1K tokens (as of May 2023)
// Reference: https://openai.com/pricing
const OPENAI_COSTS = {
  "gpt-3.5-turbo": {
    input: 0.0015,   // $0.0015 per 1K input tokens
    output: 0.002,   // $0.002 per 1K output tokens
  },
  "gpt-4": {
    input: 0.03,    // $0.03 per 1K input tokens
    output: 0.06,   // $0.06 per 1K output tokens
  },
  "gpt-4-32k": {
    input: 0.06,    // $0.06 per 1K input tokens
    output: 0.12,   // $0.12 per 1K output tokens
  },
};

/**
 * Calculate the cost of an OpenAI API call based on model and token usage
 * @returns Cost in USD
 */
export function calculateOpenAICost(model: AIModelName, tokenUsage: TokenUsage): number {
  // Default to gpt-3.5-turbo pricing if model not found
  const costRates = OPENAI_COSTS[model] || OPENAI_COSTS["gpt-3.5-turbo"];
  
  // Calculate cost
  const inputCost = (tokenUsage.prompt / 1000) * costRates.input;
  const outputCost = (tokenUsage.completion / 1000) * costRates.output;
  
  // Return total rounded to 6 decimal places
  return parseFloat((inputCost + outputCost).toFixed(6));
}

/**
 * Estimate token count for a text string (approximate)
 * OpenAI's tokenization is more complex, but this provides a rough estimate
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters or ~0.75 words
  return Math.ceil(text.length / 4);
}

/**
 * Calculate and track AI usage costs for a user
 */
export async function trackAICost(
  userId: string,
  model: AIModelName, 
  tokenUsage: TokenUsage,
  prisma: any
): Promise<void> {
  const cost = calculateOpenAICost(model, tokenUsage);
  
  // Update user's AI usage stats in database
  await prisma.aIUsageStats.upsert({
    where: { userId },
    create: {
      userId,
      totalCost: cost,
      tokenCount: tokenUsage.total,
      usageCount: 1,
      lastUsedAt: new Date(),
    },
    update: {
      totalCost: { increment: cost },
      tokenCount: { increment: tokenUsage.total },
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}
