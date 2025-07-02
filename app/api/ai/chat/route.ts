import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/ai/ai-service';
import { trackAICost } from '@/lib/ai/cost-calculation';
import { AIChatMessage, AIModelName } from '@/types/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, forceModel } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user and their health records for context
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        healthRecords: {
          select: {
            title: true,
            description: true,
            category: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 10, // Latest 10 records for context
        },
        aiInteractions: {
          select: {
            query: true,
            response: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Get last 5 interactions for context
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build context from user's health records
    let healthContext = "";
    if (user.healthRecords.length > 0) {
      healthContext = `\n\nUser's recent health records:\n${user.healthRecords
        .map(record => `- ${record.title} (${record.category}, ${record.date.toDateString()}): ${record.description || 'No description'}`)
        .join('\n')}`;
    }

    // Create system message with health context
    const systemMessage = `You are a helpful AI health assistant. You provide general health information and can help users understand their health records. 

IMPORTANT DISCLAIMERS:
- You are NOT a substitute for professional medical advice
- Always recommend consulting healthcare professionals for medical concerns
- Do not provide specific medical diagnoses
- Provide general health information and education only

User context: ${user.name || user.email}${healthContext}

Be helpful, empathetic, and always remind users to consult healthcare professionals for medical decisions.`;

    // Prepare message history for context
    const messageHistory: AIChatMessage[] = [];
    
    // Add conversation history if available
    user.aiInteractions.forEach(interaction => {
      messageHistory.push(
        { role: "user", content: interaction.query },
        { role: "assistant", content: interaction.response }
      );
    });
    
    // Add the current message
    messageHistory.push({ role: "user", content: message });

    // Initialize AI service
    const aiService = new AIService();
    
    // Process the chat with hybrid routing
    const aiResult = await aiService.routeChat(
      messageHistory,
      systemMessage,
      {
        maxTokens: 500,
        temperature: 0.7,
        forceModel: forceModel as AIModelName,
      }
    );

    // Save the interaction to database
    await prisma.aIInteraction.create({
      data: {
        query: message,
        response: aiResult.response,
        modelUsed: aiResult.model,
        cost: aiResult.cost,
        userId: user.id,
      },
    });

    // Track AI usage and cost
    await trackAICost(user.id, aiResult.model, aiResult.tokens, prisma);

    return NextResponse.json({ 
      response: aiResult.response,
      model: aiResult.model,
      provider: aiResult.provider,
      complexity: aiResult.complexity.score,
      tokens: aiResult.tokens,
      cost: aiResult.cost,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    
    // Fallback response if AI service fails
    const fallbackResponse = `I'm sorry, I'm having technical difficulties right now. Here are some general health tips:

1. Stay hydrated by drinking plenty of water
2. Get regular exercise and adequate sleep
3. Eat a balanced diet with fruits and vegetables
4. Don't hesitate to consult your healthcare provider for any health concerns

Please try again later, and remember to always consult with healthcare professionals for medical advice.`;

    return NextResponse.json({ 
      response: fallbackResponse,
      error: error?.message || 'Unknown error'
    });
  }
}
