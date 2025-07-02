import OpenAI from "openai";
import { AIChatMessage, AIModelName } from "@/types/ai";
import { AIProviderResponse, TokenUsage } from "../ai-types";
import { calculateOpenAICost } from "../cost-calculation";

interface OpenAIServiceOptions {
  apiKey?: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(options?: OpenAIServiceOptions) {
    this.openai = new OpenAI({
      apiKey: options?.apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async chat(
    messages: AIChatMessage[],
    systemMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: AIModelName;
    }
  ): Promise<AIProviderResponse> {
    try {
      const model = options?.model || "gpt-3.5-turbo";
      
      // Format messages for OpenAI API
      const formattedMessages = [
        { role: "system", content: systemMessage },
        ...messages.map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ];

      // Make API request
      const completion = await this.openai.chat.completions.create({
        model,
        messages: formattedMessages as any,
        max_tokens: options?.maxTokens || 500,
        temperature: options?.temperature || 0.7,
      });

      // Extract response text
      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      
      // Calculate token usage
      const tokenUsage: TokenUsage = {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      };

      // Calculate cost based on token usage and model
      const cost = calculateOpenAICost(model, tokenUsage);

      return {
        response,
        model,
        cost,
        tokens: tokenUsage,
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.message || "Unknown error"}`);
    }
  }
}
