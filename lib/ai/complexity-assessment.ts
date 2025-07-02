import { AIChatMessage } from "@/types/ai";
import { ComplexityAssessmentResult } from "./ai-types";

// Medical terminology keyword list (simplified)
const MEDICAL_TERMS = [
  "diagnosis", "prognosis", "chronic", "acute", "medication",
  "prescription", "symptoms", "syndrome", "disease", "illness",
  "treatment", "therapy", "surgical", "operation", "procedure",
  "dosage", "contraindication", "pathology", "etiology",
  "hypertension", "diabetes", "cancer", "cardiovascular", "neurological",
  "mri", "ct scan", "x-ray", "ultrasound", "blood test", "urinalysis",
  "cholesterol", "glucose", "insulin", "antibody", "antigen",
  "inflammation", "infection", "virus", "bacterial", "autoimmune"
];

// Complex question indicators
const COMPLEX_QUESTION_INDICATORS = [
  "why", "how", "explain", "analyze", "compare", "contrast", "evaluate",
  "interpret", "causes", "effects", "relationship", "correlation", 
  "differential diagnosis", "versus", "alternative", "recommendation",
  "predict", "prognosis", "risk factors", "long-term", "complications"
];

/**
 * Assesses the complexity of a message to determine appropriate AI model routing
 * Returns a score from 1-10, where higher scores indicate higher complexity
 */
export function assessMessageComplexity(messages: AIChatMessage[]): ComplexityAssessmentResult {
  // Extract the last user message
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
  
  if (!lastUserMessage) {
    return {
      score: 3,
      factors: {
        messageLength: 0,
        medicalTerms: 0,
        questionComplexity: 0,
        contextSize: messages.length,
      }
    };
  }

  const content = lastUserMessage.content.toLowerCase();
  
  // 1. Calculate message length factor (0-3)
  const messageLengthScore = calculateMessageLengthScore(content);
  
  // 2. Check for medical terminology (0-3)
  const medicalTermsScore = calculateMedicalTermsScore(content);
  
  // 3. Evaluate question complexity (0-3)
  const questionComplexityScore = calculateQuestionComplexityScore(content);
  
  // 4. Consider conversation context size (0-1)
  const contextSizeScore = Math.min(messages.length / 10, 1);
  
  // Calculate final score (1-10)
  const totalScore = Math.min(
    Math.round(
      messageLengthScore + 
      medicalTermsScore + 
      questionComplexityScore + 
      contextSizeScore
    ), 10
  );
  
  return {
    score: totalScore,
    factors: {
      messageLength: messageLengthScore,
      medicalTerms: medicalTermsScore,
      questionComplexity: questionComplexityScore,
      contextSize: contextSizeScore,
    },
    recommendation: {
      model: totalScore >= 7 ? "gpt-4" : "gpt-3.5-turbo",
      provider: "openai",
      reason: getComplexityReason(totalScore)
    }
  };
}

function calculateMessageLengthScore(message: string): number {
  const words = message.split(/\s+/).length;
  if (words > 100) return 3;
  if (words > 50) return 2;
  if (words > 20) return 1;
  return 0;
}

function calculateMedicalTermsScore(message: string): number {
  const termCount = MEDICAL_TERMS.filter(term => 
    message.includes(term.toLowerCase())
  ).length;
  
  if (termCount >= 5) return 3;
  if (termCount >= 3) return 2;
  if (termCount >= 1) return 1;
  return 0;
}

function calculateQuestionComplexityScore(message: string): number {
  const indicatorCount = COMPLEX_QUESTION_INDICATORS.filter(indicator => 
    message.includes(indicator.toLowerCase())
  ).length;
  
  if (indicatorCount >= 3) return 3;
  if (indicatorCount >= 2) return 2;
  if (indicatorCount >= 1) return 1;
  return 0;
}

function getComplexityReason(score: number): string {
  if (score >= 8) return "Highly complex medical query requiring advanced reasoning";
  if (score >= 6) return "Moderately complex query with multiple medical concepts";
  if (score >= 4) return "Standard health question with some medical terminology";
  return "Simple general health question";
}
