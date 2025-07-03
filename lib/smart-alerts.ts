import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { HealthRecord } from '@prisma/client';
import { generatePrompt, getAICompletion } from './ai';

/**
 * Types of smart alerts
 */
export type AlertType = 'anomaly' | 'refill' | 'milestone' | 'wellness';

/**
 * Alert priority levels
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Health anomaly alert interface
 */
export interface HealthAnomalyAlert {
  id?: string;
  title: string;
  description: string;
  detectedDate: Date;
  anomalyType: string;
  priority: AlertPriority;
  relatedRecords: string[];
  recommendation: string;
  dismissed?: boolean;
}

/**
 * Medication refill alert interface
 */
export interface MedicationRefillAlert {
  id?: string;
  title: string;
  medicationName: string;
  description: string;
  refillDue: Date;
  daysRemaining: number;
  priority: AlertPriority;
  lastFilled?: Date;
  dismissed?: boolean;
}

/**
 * Health milestone alert interface
 */
export interface HealthMilestoneAlert {
  id?: string;
  title: string;
  description: string;
  milestoneType: string;
  achievementDate: Date;
  progress: number; // 0-100
  nextStep: string;
  priority: AlertPriority;
  dismissed?: boolean;
}

/**
 * Wellness goal alert interface
 */
export interface WellnessGoalAlert {
  id?: string;
  title: string;
  description: string;
  goalType: string;
  targetDate?: Date;
  progress: number; // 0-100
  recommendation: string;
  priority: AlertPriority;
  dismissed?: boolean;
}

/**
 * Union type for all alert types
 */
export type AlertData = 
  | HealthAnomalyAlert 
  | MedicationRefillAlert 
  | HealthMilestoneAlert 
  | WellnessGoalAlert;

/**
 * Detect health anomalies in user data
 */
export async function detectHealthAnomalies(userId: string): Promise<HealthAnomalyAlert[]> {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50, // Limit to recent records
    });

    if (healthRecords.length < 3) {
      return []; // Not enough data to detect anomalies
    }

    // Group records by category
    const categorizedRecords = groupRecordsByCategory(healthRecords);
    
    // Detect anomalies in vital signs
    const vitalSignAnomalies = detectVitalSignAnomalies(categorizedRecords.vital_signs || []);
    
    // Detect anomalies in symptoms
    const symptomAnomalies = detectSymptomAnomalies(categorizedRecords.symptoms || []);
    
    // Detect anomalies in lab results
    const labResultAnomalies = detectLabResultAnomalies(categorizedRecords.lab_results || []);
    
    // Combine all anomalies
    const anomalies = [...vitalSignAnomalies, ...symptomAnomalies, ...labResultAnomalies];

    // Store the anomalies in the database
    await Promise.all(
      anomalies.map(anomaly => 
        prisma.healthAlert.create({
          data: {
            userId,
            alertType: 'anomaly',
            title: anomaly.title,
            description: anomaly.description,
            priority: anomaly.priority,
            data: anomaly as any,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        })
      )
    );

    if (anomalies.length > 0) {
      // Log the anomaly detection
      await createAuditLog({
        userId,
        action: 'detect',
        resourceType: 'health_anomalies',
        description: `Detected ${anomalies.length} health anomalies`,
      });
    }

    return anomalies;
  } catch (error) {
    console.error(`Error detecting health anomalies: ${error}`);
    throw error;
  }
}

/**
 * Predict medication refills
 */
export async function predictMedicationRefills(userId: string): Promise<MedicationRefillAlert[]> {
  try {
    // Get user's medication records
    const medicationRecords = await prisma.healthRecord.findMany({
      where: { 
        userId,
        category: 'medications',
      },
      orderBy: { date: 'desc' },
    });

    if (medicationRecords.length === 0) {
      return []; // No medications to track
    }

    // Calculate refill dates and generate alerts
    const refillAlerts = generateMedicationRefillAlerts(medicationRecords);

    // Store the refill alerts in the database
    await Promise.all(
      refillAlerts.map(alert => 
        prisma.healthAlert.create({
          data: {
            userId,
            alertType: 'refill',
            title: alert.title,
            description: alert.description,
            priority: alert.priority,
            data: alert as any,
            expiresAt: new Date(alert.refillDue.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after refill due
          },
        })
      )
    );

    if (refillAlerts.length > 0) {
      // Log the refill prediction
      await createAuditLog({
        userId,
        action: 'predict',
        resourceType: 'medication_refills',
        description: `Predicted ${refillAlerts.length} medication refills`,
      });
    }

    return refillAlerts;
  } catch (error) {
    console.error(`Error predicting medication refills: ${error}`);
    throw error;
  }
}

/**
 * Track health milestones
 */
export async function trackHealthMilestones(userId: string): Promise<HealthMilestoneAlert[]> {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (healthRecords.length < 3) {
      return []; // Not enough data to track milestones
    }

    // Get current health goals or milestones
    const healthMilestones = await generateHealthMilestones(healthRecords);

    // Store the milestone alerts in the database
    await Promise.all(
      healthMilestones.map(milestone => 
        prisma.healthAlert.create({
          data: {
            userId,
            alertType: 'milestone',
            title: milestone.title,
            description: milestone.description,
            priority: milestone.priority,
            data: milestone as any,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })
      )
    );

    if (healthMilestones.length > 0) {
      // Log the milestone tracking
      await createAuditLog({
        userId,
        action: 'track',
        resourceType: 'health_milestones',
        description: `Tracked ${healthMilestones.length} health milestones`,
      });
    }

    return healthMilestones;
  } catch (error) {
    console.error(`Error tracking health milestones: ${error}`);
    throw error;
  }
}

/**
 * Generate wellness goal recommendations
 */
export async function generateWellnessGoalRecommendations(userId: string): Promise<WellnessGoalAlert[]> {
  try {
    // Get user's health records
    const healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (healthRecords.length < 2) {
      return []; // Not enough data to recommend wellness goals
    }

    // Generate wellness goal recommendations
    const wellnessGoals = await generateWellnessGoals(healthRecords);

    // Store the wellness goals in the database
    await Promise.all(
      wellnessGoals.map(goal => 
        prisma.healthAlert.create({
          data: {
            userId,
            alertType: 'wellness',
            title: goal.title,
            description: goal.description,
            priority: goal.priority,
            data: goal as any,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        })
      )
    );

    if (wellnessGoals.length > 0) {
      // Log the wellness goal recommendations
      await createAuditLog({
        userId,
        action: 'recommend',
        resourceType: 'wellness_goals',
        description: `Generated ${wellnessGoals.length} wellness goal recommendations`,
      });
    }

    return wellnessGoals;
  } catch (error) {
    console.error(`Error generating wellness goals: ${error}`);
    throw error;
  }
}

/**
 * Get all active alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<any[]> {
  try {
    const now = new Date();
    
    // Get all active alerts
    const alerts = await prisma.healthAlert.findMany({
      where: {
        userId,
        dismissed: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: [
        { priority: 'desc' }, // high priority first
        { createdAt: 'desc' }, // most recent first
      ],
    });

    return alerts;
  } catch (error) {
    console.error(`Error fetching user alerts: ${error}`);
    throw error;
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string, userId: string): Promise<boolean> {
  try {
    // Check if the alert exists and belongs to the user
    const alert = await prisma.healthAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Update the alert to dismissed
    await prisma.healthAlert.update({
      where: { id: alertId },
      data: { dismissed: true },
    });

    // Log the alert dismissal
    await createAuditLog({
      userId,
      action: 'dismiss',
      resourceType: 'health_alert',
      resourceId: alertId,
      description: `Dismissed ${alert.alertType} alert: ${alert.title}`,
    });

    return true;
  } catch (error) {
    console.error(`Error dismissing alert: ${error}`);
    throw error;
  }
}

/**
 * Helper function to group records by category
 */
function groupRecordsByCategory(records: HealthRecord[]) {
  const categorized: Record<string, HealthRecord[]> = {};
  
  records.forEach(record => {
    if (!categorized[record.category]) {
      categorized[record.category] = [];
    }
    categorized[record.category].push(record);
  });
  
  return categorized;
}

/**
 * Detect anomalies in vital signs
 */
function detectVitalSignAnomalies(vitalRecords: HealthRecord[]): HealthAnomalyAlert[] {
  const anomalies: HealthAnomalyAlert[] = [];
  
  if (vitalRecords.length < 2) return anomalies;
  
  // Group vital signs by type (blood pressure, heart rate, etc.)
  const vitalsByType: Record<string, HealthRecord[]> = {};
  
  vitalRecords.forEach(record => {
    const vitalType = record.title.toLowerCase();
    if (!vitalsByType[vitalType]) {
      vitalsByType[vitalType] = [];
    }
    vitalsByType[vitalType].push(record);
  });
  
  // Check for anomalies in each vital sign type
  Object.entries(vitalsByType).forEach(([vitalType, records]) => {
    if (records.length < 2) return;
    
    // Sort by date, newest first
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const latestRecord = records[0];
    const previousRecords = records.slice(1);
    
    // Extract numeric values
    const latestValue = extractNumericValue(latestRecord.description || '');
    const previousValues = previousRecords.map(r => extractNumericValue(r.description || ''));
    
    if (latestValue === null) return;
    
    // Filter out null values
    const validPreviousValues = previousValues.filter(v => v !== null) as number[];
    
    if (validPreviousValues.length === 0) return;
    
    // Calculate mean and standard deviation
    const mean = validPreviousValues.reduce((sum, val) => sum + val, 0) / validPreviousValues.length;
    const stdDev = Math.sqrt(
      validPreviousValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validPreviousValues.length
    );
    
    // Check if latest value is an outlier (more than 2 standard deviations from mean)
    const zScore = Math.abs((latestValue - mean) / (stdDev || 1)); // Avoid division by zero
    
    if (zScore > 2) {
      // This is potentially an anomaly
      const direction = latestValue > mean ? 'high' : 'low';
      const anomalyType = `${vitalType}-${direction}`;
      
      anomalies.push({
        title: `Unusual ${vitalType} detected`,
        description: `Your ${vitalType} reading of ${latestValue} is ${direction} compared to your typical range.`,
        detectedDate: new Date(),
        anomalyType,
        priority: zScore > 3 ? 'high' : 'medium',
        relatedRecords: [latestRecord.id],
        recommendation: `Consider consulting with your healthcare provider if this persists or if you experience any symptoms.`
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect anomalies in symptoms
 */
function detectSymptomAnomalies(symptomRecords: HealthRecord[]): HealthAnomalyAlert[] {
  const anomalies: HealthAnomalyAlert[] = [];
  
  if (symptomRecords.length < 3) return anomalies;
  
  // Group symptoms by type
  const symptomsByType: Record<string, HealthRecord[]> = {};
  
  symptomRecords.forEach(record => {
    if (!symptomsByType[record.title]) {
      symptomsByType[record.title] = [];
    }
    symptomsByType[record.title].push(record);
  });
  
  // Check for recurring or worsening symptoms
  Object.entries(symptomsByType).forEach(([symptomType, records]) => {
    if (records.length < 3) return;
    
    // Sort by date, newest first
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Check if symptom has occurred 3+ times in the past 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentOccurrences = records.filter(r => r.date >= twoWeeksAgo);
    
    if (recentOccurrences.length >= 3) {
      anomalies.push({
        title: `Recurring ${symptomType}`,
        description: `You've reported ${symptomType} ${recentOccurrences.length} times in the past two weeks.`,
        detectedDate: new Date(),
        anomalyType: 'recurring-symptom',
        priority: 'medium',
        relatedRecords: recentOccurrences.map(r => r.id),
        recommendation: `Consider consulting with your healthcare provider about your recurring ${symptomType}.`
      });
    }
    
    // Check for increasing severity
    const severityPattern = checkSymptomSeverityPattern(records);
    if (severityPattern === 'increasing') {
      anomalies.push({
        title: `Worsening ${symptomType}`,
        description: `Your ${symptomType} appears to be increasing in severity based on your reports.`,
        detectedDate: new Date(),
        anomalyType: 'worsening-symptom',
        priority: 'high',
        relatedRecords: records.slice(0, 3).map(r => r.id),
        recommendation: `Contact your healthcare provider to discuss your worsening ${symptomType}.`
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect anomalies in lab results
 */
function detectLabResultAnomalies(labRecords: HealthRecord[]): HealthAnomalyAlert[] {
  const anomalies: HealthAnomalyAlert[] = [];
  
  if (labRecords.length === 0) return anomalies;
  
  // Process each lab record
  labRecords.forEach(record => {
    const description = record.description || '';
    
    // Check for phrases indicating abnormal results
    const abnormalPhrases = [
      'abnormal', 'elevated', 'high', 'low', 'outside range', 
      'above normal', 'below normal', 'critical', 'positive'
    ];
    
    const isAbnormal = abnormalPhrases.some(phrase => 
      description.toLowerCase().includes(phrase)
    );
    
    if (isAbnormal) {
      anomalies.push({
        title: `Abnormal ${record.title} result`,
        description: `Your lab result for ${record.title} shows an abnormal value.`,
        detectedDate: new Date(),
        anomalyType: 'abnormal-lab',
        priority: 'high',
        relatedRecords: [record.id],
        recommendation: `Follow up with your healthcare provider about this lab result.`
      });
    }
  });
  
  return anomalies;
}

/**
 * Generate medication refill alerts
 */
function generateMedicationRefillAlerts(medicationRecords: HealthRecord[]): MedicationRefillAlert[] {
  const alerts: MedicationRefillAlert[] = [];
  
  // Group medications by name
  const medicationsByName: Record<string, HealthRecord[]> = {};
  
  medicationRecords.forEach(record => {
    if (!medicationsByName[record.title]) {
      medicationsByName[record.title] = [];
    }
    medicationsByName[record.title].push(record);
  });
  
  const today = new Date();
  
  // Process each medication
  Object.entries(medicationsByName).forEach(([medicationName, records]) => {
    // Sort by date, newest first
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const latestRecord = records[0];
    const description = latestRecord.description || '';
    
    // Try to extract supply duration
    const supplyDays = extractSupplyDuration(description);
    
    if (supplyDays) {
      // Calculate when refill would be due
      const lastFilledDate = latestRecord.date;
      const refillDueDate = new Date(lastFilledDate);
      refillDueDate.setDate(refillDueDate.getDate() + supplyDays);
      
      // Calculate days remaining
      const daysRemaining = Math.ceil((refillDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate alert if refill is due within 7 days or overdue
      if (daysRemaining <= 7) {
        const priority: AlertPriority = 
          daysRemaining <= 0 ? 'high' :
          daysRemaining <= 3 ? 'medium' : 'low';
        
        alerts.push({
          title: `Medication Refill Reminder`,
          medicationName,
          description: daysRemaining <= 0 
            ? `Your ${medicationName} is overdue for a refill.`
            : `Your ${medicationName} will need a refill in ${daysRemaining} days.`,
          refillDue: refillDueDate,
          daysRemaining,
          priority,
          lastFilled: lastFilledDate,
        });
      }
    }
  });
  
  return alerts;
}

/**
 * Generate health milestones
 */
async function generateHealthMilestones(healthRecords: HealthRecord[]): Promise<HealthMilestoneAlert[]> {
  try {
    // Extract relevant health data
    const healthData = {
      recordCount: healthRecords.length,
      categories: Object.entries(groupRecordsByCategory(healthRecords))
        .map(([category, records]) => ({
          category,
          count: records.length,
          mostRecent: records.length > 0 ? records.sort((a, b) => b.date.getTime() - a.date.getTime())[0] : null,
        })),
    };
    
    // Use AI to identify potential milestones
    const prompt = generatePrompt('health-milestones', {
      healthData: JSON.stringify(healthData),
    });
    
    const completion = await getAICompletion(prompt, { temperature: 0.4 });
    
    try {
      const milestones = JSON.parse(completion) as HealthMilestoneAlert[];
      
      // Set achievement date to today for all milestones
      return milestones.map(milestone => ({
        ...milestone,
        achievementDate: new Date(),
      }));
    } catch (error) {
      console.error('Failed to parse AI response for health milestones', error);
      return [];
    }
  } catch (error) {
    console.error('Error generating health milestones', error);
    return [];
  }
}

/**
 * Generate wellness goals
 */
async function generateWellnessGoals(healthRecords: HealthRecord[]): Promise<WellnessGoalAlert[]> {
  try {
    // Group records by category
    const categorizedRecords = groupRecordsByCategory(healthRecords);
    
    // Extract patterns and issues
    const patterns = {
      symptoms: (categorizedRecords.symptoms || []).map(r => r.title),
      medications: (categorizedRecords.medications || []).map(r => r.title),
      vitalSigns: (categorizedRecords.vital_signs || []).map(r => ({ 
        name: r.title, 
        value: extractNumericValue(r.description || ''),
        date: r.date,
      })).filter(v => v.value !== null),
    };
    
    // Use AI to generate wellness goals
    const prompt = generatePrompt('wellness-goals', {
      healthData: JSON.stringify(patterns),
    });
    
    const completion = await getAICompletion(prompt, { temperature: 0.4 });
    
    try {
      return JSON.parse(completion) as WellnessGoalAlert[];
    } catch (error) {
      console.error('Failed to parse AI response for wellness goals', error);
      return [];
    }
  } catch (error) {
    console.error('Error generating wellness goals', error);
    return [];
  }
}

/**
 * Helper function to extract numeric values from strings
 */
function extractNumericValue(text: string): number | null {
  const matches = text.match(/\b(\d+(\.\d+)?)\b/);
  if (matches && matches[1]) {
    return parseFloat(matches[1]);
  }
  return null;
}

/**
 * Helper function to check symptom severity pattern
 */
function checkSymptomSeverityPattern(records: HealthRecord[]): 'increasing' | 'decreasing' | 'stable' {
  if (records.length < 3) return 'stable';
  
  // Extract severity information from descriptions
  const severities: number[] = [];
  
  records.forEach(record => {
    const description = record.description || '';
    const severityMatch = description.match(/severity:?\s*(\d+)/i);
    if (severityMatch && severityMatch[1]) {
      severities.push(parseInt(severityMatch[1]));
    } else {
      // If no severity found, use a default mid-range value
      severities.push(5);
    }
  });
  
  if (severities.length < 3) return 'stable';
  
  // Check if the pattern is consistently increasing or decreasing
  let increasing = true;
  let decreasing = true;
  
  for (let i = 1; i < severities.length; i++) {
    if (severities[i] <= severities[i - 1]) {
      increasing = false;
    }
    if (severities[i] >= severities[i - 1]) {
      decreasing = false;
    }
  }
  
  if (increasing) return 'increasing';
  if (decreasing) return 'decreasing';
  return 'stable';
}

/**
 * Helper function to extract supply duration from medication description
 */
function extractSupplyDuration(description: string): number | null {
  // Match patterns like "30 day supply", "90-day supply", "supply for 60 days"
  const supplyMatch = description.match(/(\d+)[-\s]?day supply|supply for (\d+) days/i);
  if (supplyMatch) {
    return parseInt(supplyMatch[1] || supplyMatch[2]);
  }
  
  // Match patterns like "take for 14 days"
  const durationMatch = description.match(/take for (\d+) days/i);
  if (durationMatch && durationMatch[1]) {
    return parseInt(durationMatch[1]);
  }
  
  // Default to 30 days if description contains "refill"
  if (description.toLowerCase().includes('refill')) {
    return 30;
  }
  
  return null;
}
