import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/ai/ai-service';

/**
 * Analyzes health trends from user records
 */
export async function analyzeHealthTrends(userId: string) {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20, // Analyze last 20 records
    });

    if (!healthRecords || healthRecords.length === 0) {
      return {
        trends: [],
        summary: "No health records available for analysis.",
      };
    }

    // Format health records for AI analysis
    const recordsText = healthRecords.map(record => `
      - Date: ${record.date.toISOString().split('T')[0]}
      - Category: ${record.category}
      - Title: ${record.title}
      - Description: ${record.description || 'N/A'}
    `).join('\n');

    // Create system prompt for health trend analysis
    const systemPrompt = `
      You are a health data analyst AI. Analyze the following health records and identify patterns, trends, or potential concerns. 
      Focus on:
      1. Recurring symptoms or conditions
      2. Patterns in timing or frequency
      3. Potential correlations between records
      4. Changes in health status over time
      5. Medication patterns or potential interactions
      
      Format your response as JSON with the following structure:
      {
        "trends": [
          {
            "type": "symptom_pattern" | "medication" | "appointment" | "lab_result" | "general",
            "description": "Brief description of the trend",
            "relevantDates": ["YYYY-MM-DD", ...],
            "severity": "low" | "medium" | "high",
            "recommendation": "Optional recommendation"
          }
        ],
        "summary": "Overall summary of the health trends"
      }
      
      Be factual, avoid speculation, and always note that medical advice should come from healthcare professionals.
    `;

    // Create message for AI
    const message = `Please analyze these health records for trends and patterns:\n${recordsText}`;

    // Initialize AI service
    const aiService = new AIService();
    
    // Get AI analysis
    const aiResult = await aiService.routeChat(
      [{ role: 'user', content: message }],
      systemPrompt,
      { 
        maxTokens: 1000,
        forceModel: "gpt-4", // Use more capable model for health analysis
      }
    );

    // Parse JSON response
    try {
      const analysis = JSON.parse(aiResult.response);
      
      // Save the analysis to database
      await prisma.healthAnalysis.create({
        data: {
          userId,
          summary: analysis.summary,
          trends: analysis.trends,
          recordsAnalyzed: healthRecords.length,
          aiModelUsed: aiResult.model,
          cost: aiResult.cost,
          analysisType: 'trends',
        },
      });

      return analysis;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        trends: [],
        summary: "Error analyzing health trends. Please try again later.",
        error: "Failed to parse AI response"
      };
    }
  } catch (error) {
    console.error('Health trend analysis error:', error);
    return {
      trends: [],
      summary: "Error analyzing health trends. Please try again later.",
      error: String(error)
    };
  }
}
