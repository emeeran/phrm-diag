import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { HealthRecord } from '@prisma/client';
import { generatePrompt, getAICompletion } from './ai';

/**
 * Types of predictions we can generate
 */
export type PredictionType = 'risk' | 'recommendations' | 'appointments' | 'preventive';

/**
 * Risk prediction interface
 */
export interface RiskPrediction {
  condition: string;
  probability: number; // 0-100
  timeframe: string; // "3 months", "1 year", etc.
  factors: string[];
  preventionSteps: string[];
}

/**
 * Health recommendation interface
 */
export interface HealthRecommendation {
  category: string; // "diet", "exercise", "lifestyle", "medical", etc.
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  evidence: string;
}

/**
 * Appointment timing interface
 */
export interface AppointmentTiming {
  specialistType: string;
  recommendedDate: string;
  reason: string;
  urgency: 'routine' | 'soon' | 'urgent';
  healthContext: string;
}

/**
 * Preventive care reminder interface
 */
export interface PreventiveCareReminder {
  checkupType: string;
  dueDate: string;
  frequency: string;
  lastCompleted?: string;
  description: string;
  riskReduction: string;
}

/**
 * Generate health risk predictions
 */
export async function generateHealthRiskPredictions(
  userId: string
): Promise<RiskPrediction[]> {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (healthRecords.length < 3) {
      throw new Error('Not enough health data to generate risk predictions');
    }

    // Extract relevant health data for prediction
    const healthData = extractHealthDataForPrediction(healthRecords);
    
    // Generate risk predictions using AI
    const predictions = await generateRiskPredictionsWithAI(healthData);

    // Log the prediction generation
    await createAuditLog({
      userId,
      action: 'generate',
      resourceType: 'predictive_insights',
      description: `Generated health risk predictions`,
    });

    // Store predictions in database
    await storePredictions(userId, 'risk', predictions);

    return predictions;
  } catch (error) {
    console.error(`Error generating health risk predictions: ${error}`);
    throw error;
  }
}

/**
 * Generate personalized health recommendations
 */
export async function generateHealthRecommendations(
  userId: string
): Promise<HealthRecommendation[]> {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (healthRecords.length < 2) {
      throw new Error('Not enough health data to generate recommendations');
    }

    // Extract relevant health data
    const healthData = extractHealthDataForPrediction(healthRecords);
    
    // Generate recommendations using AI
    const recommendations = await generateRecommendationsWithAI(healthData);

    // Log the recommendation generation
    await createAuditLog({
      userId,
      action: 'generate',
      resourceType: 'predictive_insights',
      description: `Generated personalized health recommendations`,
    });

    // Store recommendations in database
    await storePredictions(userId, 'recommendations', recommendations);

    return recommendations;
  } catch (error) {
    console.error(`Error generating health recommendations: ${error}`);
    throw error;
  }
}

/**
 * Generate optimal appointment timing suggestions
 */
export async function generateAppointmentTimings(
  userId: string
): Promise<AppointmentTiming[]> {
  try {
    // Get user's health records and existing appointments
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const appointments = await prisma.healthRecord.findMany({
      where: { 
        userId,
        category: 'appointments',
      },
      orderBy: { date: 'desc' },
    });

    if (healthRecords.length < 2) {
      throw new Error('Not enough health data to generate appointment suggestions');
    }

    // Extract relevant health data
    const healthData = extractHealthDataForPrediction(healthRecords);
    
    // Add existing appointments information
    const appointmentData = appointments.map(appt => ({
      title: appt.title,
      date: appt.date,
      description: appt.description || '',
    }));
    
    // Generate appointment timing suggestions using AI
    const timingSuggestions = await generateAppointmentTimingsWithAI(healthData, appointmentData);

    // Log the appointment timing generation
    await createAuditLog({
      userId,
      action: 'generate',
      resourceType: 'predictive_insights',
      description: `Generated optimal appointment timing suggestions`,
    });

    // Store timing suggestions in database
    await storePredictions(userId, 'appointments', timingSuggestions);

    return timingSuggestions;
  } catch (error) {
    console.error(`Error generating appointment timings: ${error}`);
    throw error;
  }
}

/**
 * Generate preventive care reminders
 */
export async function generatePreventiveCareReminders(
  userId: string
): Promise<PreventiveCareReminder[]> {
  try {
    // Get user's health records and demographic information
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        name: true,
        // Add other demographic fields if available in your schema
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract relevant health data
    const healthData = extractHealthDataForPrediction(healthRecords);
    
    // Generate preventive care reminders using AI
    const preventiveReminders = await generatePreventiveRemindersWithAI(healthData);

    // Log the preventive care reminder generation
    await createAuditLog({
      userId,
      action: 'generate',
      resourceType: 'predictive_insights',
      description: `Generated preventive care reminders`,
    });

    // Store preventive reminders in database
    await storePredictions(userId, 'preventive', preventiveReminders);

    return preventiveReminders;
  } catch (error) {
    console.error(`Error generating preventive care reminders: ${error}`);
    throw error;
  }
}

/**
 * Helper function to extract relevant health data for prediction
 */
function extractHealthDataForPrediction(healthRecords: HealthRecord[]) {
  // Group records by category
  const categorizedRecords: Record<string, any[]> = {};
  
  healthRecords.forEach(record => {
    if (!categorizedRecords[record.category]) {
      categorizedRecords[record.category] = [];
    }
    
    categorizedRecords[record.category].push({
      title: record.title,
      description: record.description,
      date: record.date,
    });
  });
  
  return {
    symptoms: categorizedRecords['symptoms'] || [],
    medications: categorizedRecords['medications'] || [],
    diagnoses: categorizedRecords['diagnosis'] || [],
    labResults: categorizedRecords['lab_results'] || [],
    vitalSigns: categorizedRecords['vital_signs'] || [],
    recordCount: healthRecords.length,
    earliestRecord: healthRecords.length > 0 ? 
      new Date(Math.min(...healthRecords.map(r => r.date.getTime()))) : 
      new Date(),
    latestRecord: healthRecords.length > 0 ? 
      new Date(Math.max(...healthRecords.map(r => r.date.getTime()))) : 
      new Date(),
  };
}

/**
 * Generate risk predictions using AI
 */
async function generateRiskPredictionsWithAI(healthData: any): Promise<RiskPrediction[]> {
  const prompt = generatePrompt('health-risk-prediction', {
    healthData: JSON.stringify(healthData),
  });
  
  const completion = await getAICompletion(prompt, { temperature: 0.3 });
  
  try {
    return JSON.parse(completion);
  } catch (error) {
    console.error('Failed to parse AI response for risk predictions', error);
    return [];
  }
}

/**
 * Generate recommendations using AI
 */
async function generateRecommendationsWithAI(healthData: any): Promise<HealthRecommendation[]> {
  const prompt = generatePrompt('health-recommendations', {
    healthData: JSON.stringify(healthData),
  });
  
  const completion = await getAICompletion(prompt, { temperature: 0.4 });
  
  try {
    return JSON.parse(completion);
  } catch (error) {
    console.error('Failed to parse AI response for recommendations', error);
    return [];
  }
}

/**
 * Generate appointment timing suggestions using AI
 */
async function generateAppointmentTimingsWithAI(
  healthData: any, 
  appointmentData: any[]
): Promise<AppointmentTiming[]> {
  const prompt = generatePrompt('appointment-timing', {
    healthData: JSON.stringify(healthData),
    appointmentHistory: JSON.stringify(appointmentData),
  });
  
  const completion = await getAICompletion(prompt, { temperature: 0.2 });
  
  try {
    return JSON.parse(completion);
  } catch (error) {
    console.error('Failed to parse AI response for appointment timings', error);
    return [];
  }
}

/**
 * Generate preventive care reminders using AI
 */
async function generatePreventiveRemindersWithAI(healthData: any): Promise<PreventiveCareReminder[]> {
  const prompt = generatePrompt('preventive-care', {
    healthData: JSON.stringify(healthData),
  });
  
  const completion = await getAICompletion(prompt, { temperature: 0.3 });
  
  try {
    return JSON.parse(completion);
  } catch (error) {
    console.error('Failed to parse AI response for preventive care reminders', error);
    return [];
  }
}

/**
 * Store predictions in the database
 */
async function storePredictions(userId: string, type: PredictionType, data: any) {
  await prisma.predictiveInsight.create({
    data: {
      userId,
      insightType: type,
      data,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
    },
  });
}
