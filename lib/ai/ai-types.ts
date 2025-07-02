import { AIServiceType, AIModelName } from "@/types/ai";

export interface AIModelConfig {
  model: AIModelName;
  provider: AIServiceType;
  maxTokens?: number;
  temperature?: number;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ComplexityAssessmentResult {
  score: number;  // 1-10 scale, 10 being most complex
  factors: {
    messageLength: number;
    medicalTerms: number;
    questionComplexity: number;
    contextSize: number;
  };
  recommendation?: {
    model: AIModelName;
    provider: AIServiceType;
    reason: string;
  };
}

export interface AIProviderResponse {
  response: string;
  model: AIModelName;
  cost: number;
  tokens: TokenUsage;
}
