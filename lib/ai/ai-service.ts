import { AIServiceType, AIModelName, AIChatMessage } from "@/types/ai";
import { OpenAIService } from "./providers/openai-service";
import { AIModelConfig, ComplexityAssessmentResult } from "./ai-types";
import { assessMessageComplexity } from "./complexity-assessment";

interface AIProviderOptions {
  apiKey?: string;
}

export class AIService {
  private openAIService: OpenAIService;
  
  constructor(options?: AIProviderOptions) {
    this.openAIService = new OpenAIService({
      apiKey: options?.apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Routes a chat request to the appropriate AI provider based on complexity assessment
   */
  async routeChat(
    messages: AIChatMessage[],
    systemMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      forceProvider?: AIServiceType;
      forceModel?: AIModelName;
    }
  ): Promise<{
    response: string;
    model: AIModelName;
    provider: AIServiceType;
    cost: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    complexity: ComplexityAssessmentResult;
  }> {
    try {
      // If a provider is forced, use it
      if (options?.forceProvider) {
        return this.handleChatWithProvider(
          options.forceProvider,
          messages,
          systemMessage,
          options
        );
      }

      // Assess complexity of the messages to determine routing
      const complexityResult = assessMessageComplexity(messages);
      
      // Based on complexity, select the appropriate provider and model
      let provider: AIServiceType = "openai";
      let modelConfig: AIModelConfig = {
        model: complexityResult.score >= 7 ? "gpt-4" : "gpt-3.5-turbo",
        provider: "openai",
      };
      
      console.log(`Routing to ${modelConfig.provider}:${modelConfig.model} (complexity: ${complexityResult.score}/10)`);

      // Make the actual chat request
      return this.handleChatWithProvider(
        provider,
        messages,
        systemMessage,
        { 
          ...options,
          forceModel: options?.forceModel || modelConfig.model 
        },
        complexityResult
      );
    } catch (error) {
      console.error("Error in AI routing:", error);
      throw new Error(`AI service error: ${error.message || "Unknown error"}`);
    }
  }

  private async handleChatWithProvider(
    provider: AIServiceType,
    messages: AIChatMessage[],
    systemMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      forceModel?: AIModelName;
    },
    complexity?: ComplexityAssessmentResult
  ) {
    // Currently we only support OpenAI
    if (provider === "openai") {
      const result = await this.openAIService.chat(messages, systemMessage, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        model: options?.forceModel,
      });
      
      return {
        ...result,
        provider: "openai" as AIServiceType,
        complexity: complexity || assessMessageComplexity(messages),
      };
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  }
}
