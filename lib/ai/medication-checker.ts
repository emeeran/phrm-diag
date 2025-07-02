import { AIService } from './ai-service';

interface MedicationData {
  name: string;
  dosage?: string;
  frequency?: string;
}

interface MedicationInteraction {
  medications: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export async function checkMedicationInteractions(
  medications: MedicationData[]
): Promise<{
  interactions: MedicationInteraction[];
  summary: string;
  disclaimer: string;
}> {
  try {
    if (!medications || medications.length < 2) {
      return {
        interactions: [],
        summary: "At least two medications are required to check for interactions.",
        disclaimer: "This information is for educational purposes only and is not medical advice."
      };
    }

    // Format medications for AI analysis
    const medsText = medications.map(med => 
      `- ${med.name}${med.dosage ? ` (${med.dosage})` : ''}${med.frequency ? `, ${med.frequency}` : ''}`
    ).join('\n');

    // Create system prompt for medication interaction checking
    const systemPrompt = `
      You are a medication interaction checking AI. You provide general information about potential 
      interactions between medications. 
      
      IMPORTANT DISCLAIMERS:
      - You are NOT a substitute for professional medical advice
      - Always recommend consulting healthcare professionals for medical concerns
      - Do not provide specific medical advice
      - Provide general medication information and education only
      
      Analyze the provided medications list and identify potential interactions or concerns.
      Format your response as JSON with the following structure:
      {
        "interactions": [
          {
            "medications": ["Medication A", "Medication B"],
            "severity": "low" | "medium" | "high",
            "description": "Brief description of the interaction",
            "recommendation": "General recommendation"
          }
        ],
        "summary": "Overall summary of potential interactions",
        "disclaimer": "Include a medical disclaimer here"
      }
    `;

    // Create message for AI
    const message = `Please check for potential interactions between these medications:\n${medsText}`;

    // Initialize AI service
    const aiService = new AIService();
    
    // Get AI analysis
    const aiResult = await aiService.routeChat(
      [{ role: 'user', content: message }],
      systemPrompt,
      { 
        maxTokens: 1000,
        forceModel: "gpt-4", // Use more capable model for medication analysis
      }
    );

    // Parse JSON response
    try {
      return JSON.parse(aiResult.response);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        interactions: [],
        summary: "Error checking medication interactions. Please try again later.",
        disclaimer: "This information is for educational purposes only and is not medical advice."
      };
    }
  } catch (error) {
    console.error('Medication interaction error:', error);
    return {
      interactions: [],
      summary: "Error checking medication interactions. Please try again later.",
      disclaimer: "This information is for educational purposes only and is not medical advice."
    };
  }
}
