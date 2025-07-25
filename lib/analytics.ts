import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { HealthRecord } from '@prisma/client';

/**
 * Types of analysis we can perform
 */
export type AnalysisType = 'trends' | 'medication' | 'risk' | 'symptoms';

/**
 * Structure for trend data
 */
export interface TrendPoint {
  date: string;
  value: number;
  category: string;
  recordId?: string;
}

/**
 * Structure for risk score calculation
 */
export interface RiskScore {
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'severe';
  factors: string[];
  recommendations: string[];
}

/**
 * Structure for medication effectiveness analysis
 */
export interface MedicationEffectiveness {
  medicationName: string;
  effectiveness: number; // 0-100
  sideEffects: string[];
  interactions: string[];
  adherence: number; // 0-100, percentage of consistent usage
}

/**
 * Structure for symptom pattern
 */
export interface SymptomPattern {
  symptom: string;
  frequency: number;
  intensity: number; // 1-10
  triggers: string[];
  correlations: {
    factor: string;
    strength: number; // 0-1, correlation coefficient
  }[];
}

/**
 * Main function to generate health analytics
 */
export async function generateHealthAnalytics(
  userId: string,
  analysisType: AnalysisType
): Promise<string> {
  try {
    // Check if there's a recent analysis of this type (within 24 hours)
    const recentAnalysis = await prisma.healthAnalysis.findFirst({
      where: {
        userId,
        analysisType,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If there's a recent analysis, return its ID
    if (recentAnalysis) {
      return recentAnalysis.id;
    }

    // Get all health records for the user
    const healthRecords = await prisma.healthRecord.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (healthRecords.length === 0) {
      throw new Error('No health records found for analysis');
    }

    // Perform the specified analysis
    let analysisData;
    let summary = '';
    
    switch (analysisType) {
      case 'trends':
        analysisData = await analyzeHealthTrends(healthRecords);
        summary = generateTrendSummary(analysisData);
        break;
      case 'medication':
        analysisData = await analyzeMedicationEffectiveness(healthRecords);
        summary = generateMedicationSummary(analysisData);
        break;
      case 'risk':
        analysisData = await calculateHealthRiskScore(healthRecords);
        summary = generateRiskSummary(analysisData);
        break;
      case 'symptoms':
        analysisData = await analyzeSymptomPatterns(healthRecords);
        summary = generateSymptomSummary(analysisData);
        break;
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }

    // Create a record of the analysis in the database
    const analysis = await prisma.healthAnalysis.create({
      data: {
        userId,
        summary,
        trends: JSON.stringify(analysisData),
        recordsAnalyzed: healthRecords.length,
        aiModelUsed: 'analytics-engine-v1',
        analysisType,
      },
    });

    // Log the analysis generation
    await createAuditLog({
      userId,
      action: 'create',
      resourceType: 'health_analysis',
      resourceId: analysis.id,
      description: `Generated ${analysisType} health analysis`,
    });

    return analysis.id;
  } catch (error) {
    console.error(`Error generating health analytics: ${error}`);
    throw error;
  }
}

/**
 * Analyze health trends from records
 */
async function analyzeHealthTrends(
  healthRecords: HealthRecord[]
): Promise<TrendPoint[]> {
  // Group records by category
  const recordsByCategory: Record<string, HealthRecord[]> = {};
  
  for (const record of healthRecords) {
    if (!recordsByCategory[record.category]) {
      recordsByCategory[record.category] = [];
    }
    recordsByCategory[record.category].push(record);
  }

  const trends: TrendPoint[] = [];

  // Analyze each category
  for (const [category, records] of Object.entries(recordsByCategory)) {
    // Sort records by date
    records.sort((a, b) => a.date.getTime() - b.date.getTime());

    // For each record, extract trend data
    for (const record of records) {
      let value = 0;
      
      // Extract numeric values from the description or title based on category
      if (category === 'vital_signs' || category === 'lab_results') {
        // Extract numbers from description (e.g., "Blood pressure 120/80")
        const numbers = record.description?.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length > 0) {
          value = parseFloat(numbers[0]);
        }
      } else if (category === 'medications') {
        // For medications, track frequency or dosage
        const dosage = record.description?.match(/\d+(\.\d+)?\s*(mg|ml|g)/i);
        if (dosage && dosage.length > 0) {
          value = parseFloat(dosage[0]);
        } else {
          value = 1; // Just count the occurrence
        }
      } else if (category === 'symptoms') {
        // For symptoms, look for severity indicators (1-10)
        const severity = record.description?.match(/severity:?\s*(\d+)/i);
        if (severity && severity.length > 1) {
          value = parseFloat(severity[1]);
        } else {
          value = 5; // Default severity
        }
      } else {
        // For other categories, just count occurrences
        value = 1;
      }

      trends.push({
        date: record.date.toISOString().split('T')[0],
        value,
        category,
        recordId: record.id,
      });
    }
  }

  return trends;
}

/**
 * Analyze medication effectiveness
 */
async function analyzeMedicationEffectiveness(
  healthRecords: HealthRecord[]
): Promise<MedicationEffectiveness[]> {
  // Filter for medication records
  const medicationRecords = healthRecords.filter(
    record => record.category === 'medications'
  );

  if (medicationRecords.length === 0) {
    return [];
  }

  // Get symptom records for correlation
  const symptomRecords = healthRecords.filter(
    record => record.category === 'symptoms'
  );

  // Extract unique medications
  const medications: Record<string, MedicationEffectiveness> = {};

  for (const record of medicationRecords) {
    // Extract medication name from title
    const medicationName = record.title;
    
    if (!medications[medicationName]) {
      medications[medicationName] = {
        medicationName,
        effectiveness: 0,
        sideEffects: [],
        interactions: [],
        adherence: 0,
      };
    }
  }

  // Calculate effectiveness based on symptom reduction after medication start
  // This is a simplified version - in a real system this would be more sophisticated
  for (const [medicationName, medication] of Object.entries(medications)) {
    // Find when this medication was started
    const medicationStartDates = medicationRecords
      .filter(record => record.title === medicationName)
      .map(record => record.date.getTime());

    if (medicationStartDates.length === 0) continue;
    
    const earliestStartDate = Math.min(...medicationStartDates);
    
    // Count symptoms before and after medication
    const symptomsBefore = symptomRecords.filter(
      record => record.date.getTime() < earliestStartDate
    ).length;
    
    const symptomsAfter = symptomRecords.filter(
      record => record.date.getTime() >= earliestStartDate
    ).length;
    
    // Simple effectiveness calculation
    if (symptomsBefore > 0) {
      const reductionRate = Math.max(0, (symptomsBefore - symptomsAfter) / symptomsBefore);
      medication.effectiveness = Math.round(reductionRate * 100);
    } else {
      medication.effectiveness = 50; // Default if no prior symptoms
    }
    
    // Calculate adherence based on regularity of medication records
    const medicationDates = medicationRecords
      .filter(record => record.title === medicationName)
      .map(record => record.date.getTime())
      .sort((a, b) => a - b);
    
    if (medicationDates.length > 1) {
      // Calculate expected intervals
      const intervalSum = medicationDates
        .slice(1)
        .reduce((sum, date, i) => sum + (date - medicationDates[i]), 0);
      
      const averageInterval = intervalSum / (medicationDates.length - 1);
      
      // Calculate adherence based on consistency of intervals
      const intervalVariations = medicationDates
        .slice(1)
        .map((date, i) => Math.abs((date - medicationDates[i]) - averageInterval));
      
      const averageVariation = intervalVariations.reduce((sum, val) => sum + val, 0) / 
                               intervalVariations.length;
      
      medication.adherence = Math.min(100, Math.max(0, 
        Math.round(100 - (averageVariation / averageInterval) * 100)
      ));
    } else {
      medication.adherence = 100; // Default for single record
    }

    // Look for side effects mentioned in descriptions
    const sideEffectKeywords = ['side effect', 'adverse', 'reaction', 'issue'];
    
    for (const record of symptomRecords) {
      if (record.date.getTime() >= earliestStartDate && 
          record.description && 
          sideEffectKeywords.some(keyword => 
            record.description?.toLowerCase().includes(keyword)
          )) {
        medication.sideEffects.push(record.title);
      }
    }

    // Check for potential interactions with other medications
    try {
      // Safety check - only proceed if we have medications to compare
      if (Object.keys(medications).length > 1) {
        for (const [otherName, otherMedication] of Object.entries(medications)) {
          if (otherName !== medicationName) {
            // More robust interaction check with retry mechanism
            try {
              // 1. Check for common side effects
              const commonSideEffects = medication.sideEffects.filter(se => 
                otherMedication.sideEffects.includes(se)
              );
              
              // 2. Known medication interaction classes - with retry for reliability
              const interactionRisks = await withRetry(async () => {
                return checkMedicationInteractionRisks(medicationName, otherName);
              }, 2);
              
              if (commonSideEffects.length > 0) {
                medication.interactions.push(`${otherName} (common side effects)`);
              }
              
              // Add specific interaction warnings if available
              if (interactionRisks.length > 0) {
                for (const risk of interactionRisks) {
                  medication.interactions.push(risk);
                }
              }
              
              // 3. Try to get additional information from external API (when implemented)
              try {
                const externalInteractions = await withRetry(() => 
                  fetchExternalInteractionAPI(medicationName, otherName)
                );
                
                if (externalInteractions.length > 0) {
                  for (const interaction of externalInteractions) {
                    medication.interactions.push(interaction);
                  }
                }
              } catch (apiError) {
                // Just log but don't fail if external API has issues
                console.error(`External medication API error: ${apiError}`);
              }
            } catch (interactionError) {
              console.error(`Error checking interactions between ${medicationName} and ${otherName}: ${interactionError}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking medication interactions: ${error}`);
      // Don't fail completely, just log the error and continue
    }
  }

  return Object.values(medications);
}

/**
 * Check for known medication interaction risks
 * This is a simplified placeholder - in a real system this would connect to a medication database
 */
/**
 * Check for known medication interaction risks using our local database
 * This function is synchronous for reliability, with async API calls handled separately
 */
function checkMedicationInteractionRisks(med1: string, med2: string): string[] {
  try {
    const med1Lower = med1.toLowerCase();
    const med2Lower = med2.toLowerCase();
    
    // Enhanced database of medication interactions
    const knownInteractions: Record<string, string[]> = {
      // Blood thinners
      'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'citalopram', 'fluoxetine', 'clopidogrel', 
                  'metronidazole', 'ciprofloxacin', 'levothyroxine', 'amiodarone'],
      'aspirin': ['warfarin', 'heparin', 'clopidogrel', 'ibuprofen', 'naproxen', 'apixaban', 
                 'rivaroxaban', 'prednisone', 'venlafaxine'],
      'clopidogrel': ['omeprazole', 'esomeprazole', 'fluconazole', 'aspirin'],
      
      // Blood pressure medications
      'lisinopril': ['spironolactone', 'potassium supplements', 'potassium salt substitutes',
                    'lithium', 'nsaids', 'ibuprofen', 'naproxen'],
      'metoprolol': ['amiodarone', 'diltiazem', 'verapamil', 'fluoxetine', 'paroxetine'],
      'amlodipine': ['simvastatin', 'atorvastatin', 'grapefruit', 'diltiazem', 'verapamil'],
      
      // Cholesterol medications
      'simvastatin': ['erythromycin', 'clarithromycin', 'itraconazole', 'ketoconazole', 'grapefruit',
                     'diltiazem', 'amiodarone', 'verapamil', 'amlodipine', 'cyclosporine'],
      'atorvastatin': ['grapefruit', 'erythromycin', 'clarithromycin', 'itraconazole', 'ritonavir'],
      
      // Heart rhythm medications
      'amiodarone': ['warfarin', 'digoxin', 'simvastatin', 'atorvastatin', 'metoprolol', 'levofloxacin',
                    'ciprofloxacin', 'citalopram'],
      'digoxin': ['amiodarone', 'clarithromycin', 'verapamil', 'spironolactone', 'furosemide'],
      
      // Antibiotics
      'ciprofloxacin': ['warfarin', 'amiodarone', 'theophylline', 'metronidazole', 'nsaids'],
      'clarithromycin': ['simvastatin', 'atorvastatin', 'warfarin', 'digoxin', 'carbamazepine'],
      'azithromycin': ['pimozide', 'amiodarone', 'warfarin'],
      
      // Antidepressants
      'fluoxetine': ['warfarin', 'nsaids', 'tramadol', 'triptans', 'linezolid', 'monoamine oxidase inhibitors'],
      'paroxetine': ['tamoxifen', 'warfarin', 'tramadol', 'triptans', 'metoprolol'],
      'sertraline': ['warfarin', 'nsaids', 'tramadol', 'triptans', 'linezolid'],
      'venlafaxine': ['linezolid', 'monoamine oxidase inhibitors', 'triptans', 'tramadol'],
      
      // Pain medications
      'tramadol': ['ssris', 'fluoxetine', 'paroxetine', 'sertraline', 'venlafaxine', 'monoamine oxidase inhibitors'],
      'ibuprofen': ['warfarin', 'aspirin', 'lisinopril', 'diuretics', 'methotrexate'],
      'naproxen': ['warfarin', 'aspirin', 'lisinopril', 'diuretics', 'methotrexate'],
      
      // Diabetes medications
      'metformin': ['contrast dyes', 'alcohol', 'cimetidine', 'furosemide', 'nifedipine'],
      'glyburide': ['fluconazole', 'ciprofloxacin', 'nsaids', 'beta blockers', 'warfarin'],
      
      // Common supplements
      'st johns wort': ['warfarin', 'birth control', 'antidepressants', 'digoxin', 'cyclosporine'],
      'ginkgo biloba': ['warfarin', 'aspirin', 'clopidogrel', 'ibuprofen', 'naproxen'],
      'ginseng': ['warfarin', 'aspirin', 'heparin', 'insulin', 'antidepressants']
    };
    
    // Common medication classes for broader matching
    const medicationClasses: Record<string, string[]> = {
      'nsaids': ['ibuprofen', 'naproxen', 'celecoxib', 'diclofenac', 'indomethacin'],
      'ssris': ['fluoxetine', 'paroxetine', 'sertraline', 'citalopram', 'escitalopram'],
      'beta blockers': ['metoprolol', 'atenolol', 'propranolol', 'carvedilol', 'bisoprolol'],
      'statins': ['simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin'],
      'diuretics': ['furosemide', 'hydrochlorothiazide', 'spironolactone', 'chlorthalidone'],
      'triptans': ['sumatriptan', 'rizatriptan', 'eletriptan', 'zolmitriptan']
    };
    
    // Check for interactions in both directions
    const interactions: string[] = [];
    
    // Direct medicine name matching
    for (const [baseMed, interactingMeds] of Object.entries(knownInteractions)) {
      // Check if medication1 contains the base med name
      if (med1Lower.includes(baseMed)) {
        // Check if medication2 contains any of the interacting medications
        for (const interactMed of interactingMeds) {
          if (med2Lower.includes(interactMed)) {
            interactions.push(`${med1} may interact with ${med2} (increased risk)`);
            break;
          }
        }
      }
      
      // Check the reverse direction
      if (med2Lower.includes(baseMed)) {
        for (const interactMed of interactingMeds) {
          if (med1Lower.includes(interactMed)) {
            interactions.push(`${med2} may interact with ${med1} (increased risk)`);
            break;
          }
        }
      }
    }
    
    // Medication class matching (for broader coverage)
    for (const [className, medicines] of Object.entries(medicationClasses)) {
      // Check if medication1 is in this class
      const med1InClass = medicines.some(med => med1Lower.includes(med));
      if (med1InClass) {
        // If med1 is in a class, check if med2 is a base medication that interacts with this class
        // This helps catch interactions like "ibuprofen (an NSAID) may interact with warfarin"
        for (const [baseMed, interactingMeds] of Object.entries(knownInteractions)) {
          if (interactingMeds.includes(className) && med2Lower.includes(baseMed)) {
            interactions.push(`${med1} (class: ${className}) may interact with ${med2}`);
          }
        }
      }
      // Check if medication2 is in this class
      const med2InClass = medicines.some(med => med2Lower.includes(med));
      if (med2InClass) {
        // If med2 is in a class, check if med1 is a base medication that interacts with this class
        // This helps catch interactions like "warfarin may interact with ibuprofen (an NSAID)"
        for (const [baseMed, interactingMeds] of Object.entries(knownInteractions)) {
          if (interactingMeds.includes(className) && med1Lower.includes(baseMed)) {
            interactions.push(`${med2} (class: ${className}) may interact with ${med1}`);
          }
        }
      }
    }
    
    // Note: External API calls are now handled at a higher level
    // This makes this function synchronous and more reliable
    
    return interactions;
  } catch (error) {
    console.error(`Error in medication interaction check: ${error}`);
    // Return an empty array instead of throwing
    return [];
  }
}

/**
 * Safely retry a function multiple times with exponential backoff
 * This helps handle transient network issues when checking medication interactions
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 300
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${retries} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries - 1) {
        // Exponential backoff - wait longer between each retry
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after multiple retries");
}

/**
 * Placeholder for external medication interaction API integration
 * In a production environment, this would connect to a professional drug interaction database
 */
async function fetchExternalInteractionAPI(med1: string, med2: string): Promise<string[]> {
  // This is a placeholder for an external API call
  // In a real system, this would make an HTTP request to a medication interaction API
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For demonstration, let's return some realistic response for a few common medications
    // This would be replaced with actual API logic in production
    const commonInteractions: Record<string, Record<string, string[]>> = {
      'warfarin': {
        'aspirin': ['Increased bleeding risk', 'Monitor for signs of bleeding'],
        'ibuprofen': ['Increased bleeding risk', 'Consider alternative pain reliever']
      },
      'lisinopril': {
        'spironolactone': ['Increased risk of hyperkalemia', 'Monitor potassium levels'],
        'potassium': ['Dangerous potassium elevation possible', 'Avoid combination']
      },
      'simvastatin': {
        'grapefruit': ['Increased risk of myopathy', 'Avoid grapefruit consumption'],
        'amiodarone': ['Increased risk of muscle damage', 'Dose adjustment recommended']
      }
    };
    
    const med1Lower = med1.toLowerCase();
    const med2Lower = med2.toLowerCase();
    
    // Check for known interactions in our simulated API
    for (const [baseMed, interactions] of Object.entries(commonInteractions)) {
      if (med1Lower.includes(baseMed)) {
        for (const [interactMed, warnings] of Object.entries(interactions)) {
          if (med2Lower.includes(interactMed)) {
            return warnings.map(warning => `${med1}-${med2}: ${warning}`);
          }
        }
      } else if (med2Lower.includes(baseMed)) {
        for (const [interactMed, warnings] of Object.entries(interactions)) {
          if (med1Lower.includes(interactMed)) {
            return warnings.map(warning => `${med2}-${med1}: ${warning}`);
          }
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error("External medication API error:", error);
    throw new Error("Error accessing medication interaction database");
  }
}

/**
 * Calculate health risk score
 */
async function calculateHealthRiskScore(
  healthRecords: HealthRecord[]
): Promise<RiskScore> {
  // Initialize risk score
  const riskScore: RiskScore = {
    score: 0,
    level: 'low',
    factors: [],
    recommendations: [],
  };

  // Count risk factors
  const chronicConditions = healthRecords.filter(
    r => r.category === 'diagnosis' && r.description?.toLowerCase().includes('chronic')
  ).length;

  const highBloodPressure = healthRecords.some(
    r => r.title.toLowerCase().includes('blood pressure') && 
         r.description?.match(/\d+\/\d+/) &&
         parseInt(r.description.match(/(\d+)\/\d+/)?.[1] || '0') > 140
  );

  const highCholesterol = healthRecords.some(
    r => r.title.toLowerCase().includes('cholesterol') && 
         r.description?.match(/\d+/) &&
         parseInt(r.description.match(/(\d+)/)?.[1] || '0') > 200
  );

  const diabetes = healthRecords.some(
    r => r.title.toLowerCase().includes('glucose') || 
         r.title.toLowerCase().includes('diabetes') ||
         r.description?.toLowerCase().includes('diabetes')
  );

  const heartIssues = healthRecords.some(
    r => r.title.toLowerCase().includes('heart') || 
         r.description?.toLowerCase().includes('heart')
  );

  const smoking = healthRecords.some(
    r => r.title.toLowerCase().includes('smoking') || 
         r.description?.toLowerCase().includes('smok')
  );

  // Calculate base risk score
  let score = 0;
  
  if (chronicConditions > 0) {
    score += chronicConditions * 10;
    riskScore.factors.push(`${chronicConditions} chronic condition(s) detected`);
  }
  
  if (highBloodPressure) {
    score += 20;
    riskScore.factors.push('High blood pressure detected');
    riskScore.recommendations.push('Monitor blood pressure regularly and consult with healthcare provider');
  }
  
  if (highCholesterol) {
    score += 15;
    riskScore.factors.push('High cholesterol detected');
    riskScore.recommendations.push('Consider dietary changes and regular cholesterol screening');
  }
  
  if (diabetes) {
    score += 25;
    riskScore.factors.push('Diabetes or high blood glucose detected');
    riskScore.recommendations.push('Regular glucose monitoring and follow diabetic care plan');
  }
  
  if (heartIssues) {
    score += 25;
    riskScore.factors.push('Heart issues detected');
    riskScore.recommendations.push('Consult with cardiologist for thorough evaluation');
  }
  
  if (smoking) {
    score += 15;
    riskScore.factors.push('Smoking history detected');
    riskScore.recommendations.push('Consider smoking cessation programs');
  }
  
  // Age factor - assume we can extract age from records
  const ageRecord = healthRecords.find(r => 
    r.title.toLowerCase().includes('age') || 
    r.description?.toLowerCase().includes('age')
  );
  
  if (ageRecord) {
    const ageMatch = ageRecord.description?.match(/\b(\d{1,3})\s*(?:years?|yrs?|y\/o)\b/i);
    if (ageMatch && ageMatch[1]) {
      const age = parseInt(ageMatch[1]);
      if (age > 65) {
        score += 15;
        riskScore.factors.push('Age over 65');
      } else if (age > 50) {
        score += 10;
        riskScore.factors.push('Age over 50');
      }
    }
  }
  
  // Family history
  const familyHistoryRecord = healthRecords.find(r => 
    r.title.toLowerCase().includes('family history') || 
    r.description?.toLowerCase().includes('family history')
  );
  
  if (familyHistoryRecord) {
    score += 10;
    riskScore.factors.push('Family history of health issues');
    riskScore.recommendations.push('Consider genetic counseling or screening');
  }
  
  // Cap score at 100
  riskScore.score = Math.min(100, score);
  
  // Determine risk level
  if (riskScore.score < 25) {
    riskScore.level = 'low';
  } else if (riskScore.score < 50) {
    riskScore.level = 'moderate';
  } else if (riskScore.score < 75) {
    riskScore.level = 'high';
  } else {
    riskScore.level = 'severe';
  }
  
  // Add general recommendations if none exist
  if (riskScore.recommendations.length === 0) {
    if (riskScore.level === 'low') {
      riskScore.recommendations.push('Maintain healthy lifestyle with regular check-ups');
    } else if (riskScore.level === 'moderate') {
      riskScore.recommendations.push('Schedule a comprehensive health assessment with your provider');
    } else {
      riskScore.recommendations.push('Urgent: Consult with healthcare provider for comprehensive evaluation');
    }
  }
  
  return riskScore;
}

/**
 * Analyze symptom patterns
 */
async function analyzeSymptomPatterns(
  healthRecords: HealthRecord[]
): Promise<SymptomPattern[]> {
  // Filter for symptom records
  const symptomRecords = healthRecords.filter(
    record => record.category === 'symptoms'
  );
  
  if (symptomRecords.length === 0) {
    return [];
  }
  
  // Extract unique symptoms
  const symptoms: Record<string, SymptomPattern> = {};
  
  for (const record of symptomRecords) {
    const symptom = record.title;
    
    if (!symptoms[symptom]) {
      symptoms[symptom] = {
        symptom,
        frequency: 0,
        intensity: 0,
        triggers: [],
        correlations: [],
      };
    }
    
    symptoms[symptom].frequency += 1;
    
    // Extract intensity if available
    const intensityMatch = record.description?.match(/intensity|severity|level|pain|scale|rate|score:\s*(\d+)/i);
    if (intensityMatch && intensityMatch[1]) {
      const intensity = parseInt(intensityMatch[1]);
      if (intensity > 0) {
        // Keep a running average
        symptoms[symptom].intensity = 
          (symptoms[symptom].intensity * (symptoms[symptom].frequency - 1) + intensity) / 
          symptoms[symptom].frequency;
      }
    }
    
    // Extract potential triggers
    const triggerKeywords = ['after', 'following', 'triggered by', 'cause', 'due to'];
    if (record.description) {
      for (const keyword of triggerKeywords) {
        const regex = new RegExp(`${keyword}\\s+([\\w\\s]+)(?:[.,;]|$)`, 'i');
        const match = record.description.match(regex);
        if (match && match[1]) {
          const trigger = match[1].trim();
          if (!symptoms[symptom].triggers.includes(trigger)) {
            symptoms[symptom].triggers.push(trigger);
          }
        }
      }
    }
  }
  
  // Find correlations between symptoms and other health records
  for (const [symptomName, symptomPattern] of Object.entries(symptoms)) {
    const symptomDates = symptomRecords
      .filter(r => r.title === symptomName)
      .map(r => r.date.getTime());
    
    // Look for records within 3 days before a symptom appears
    const WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    
    // Count co-occurrences of other categories
    const cooccurrences: Record<string, number> = {};
    const totalOccurrences: Record<string, number> = {};
    
    for (const symptomDate of symptomDates) {
      // Look for records within 3 days before this symptom
      const relatedRecords = healthRecords.filter(
        r => r.date.getTime() <= symptomDate && 
             r.date.getTime() >= symptomDate - WINDOW_MS &&
             r.category !== 'symptoms'
      );
      
      for (const record of relatedRecords) {
        const factor = `${record.category}:${record.title}`;
        
        cooccurrences[factor] = (cooccurrences[factor] || 0) + 1;
        totalOccurrences[factor] = (totalOccurrences[factor] || 0) + 1;
      }
    }
    
    // Calculate correlation strength
    for (const [factor, count] of Object.entries(cooccurrences)) {
      if (count > 1) {  // Only include if it happened more than once
        const strength = count / symptomPattern.frequency; // Normalized 0-1
        if (strength > 0.3) { // Only include meaningful correlations
          symptomPattern.correlations.push({
            factor,
            strength,
          });
        }
      }
    }
    
    // Sort correlations by strength
    symptomPattern.correlations.sort((a, b) => b.strength - a.strength);
    
    // Limit to top 5 correlations
    symptomPattern.correlations = symptomPattern.correlations.slice(0, 5);
  }
  
  return Object.values(symptoms);
}

/**
 * Generate a summary for trend analysis
 */
function generateTrendSummary(trends: TrendPoint[]): string {
  if (trends.length === 0) {
    return 'Insufficient data for trend analysis.';
  }
  
  // Group trends by category
  const trendsByCategory: Record<string, TrendPoint[]> = {};
  for (const trend of trends) {
    if (!trendsByCategory[trend.category]) {
      trendsByCategory[trend.category] = [];
    }
    trendsByCategory[trend.category].push(trend);
  }
  
  const summaries = [];
  
  for (const [category, categoryTrends] of Object.entries(trendsByCategory)) {
    // Sort by date
    categoryTrends.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Need at least 2 points for a trend
    if (categoryTrends.length < 2) {
      summaries.push(`Not enough ${category} data points for trend analysis.`);
      continue;
    }
    
    // Calculate simple trend
    const firstValue = categoryTrends[0].value;
    const lastValue = categoryTrends[categoryTrends.length - 1].value;
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;
    
    if (Math.abs(changePercent) < 5) {
      summaries.push(`${category} has remained relatively stable.`);
    } else if (changePercent > 0) {
      summaries.push(`${category} has increased by approximately ${Math.round(changePercent)}% over the recorded period.`);
    } else {
      summaries.push(`${category} has decreased by approximately ${Math.round(Math.abs(changePercent))}% over the recorded period.`);
    }
  }
  
  return summaries.join(' ');
}

/**
 * Generate a summary for medication effectiveness analysis
 */
function generateMedicationSummary(medications: MedicationEffectiveness[]): string {
  if (medications.length === 0) {
    return 'No medication data available for analysis.';
  }
  
  const summary = [];
  
  try {
    // Count medications
    summary.push(`Analysis of ${medications.length} medication${medications.length > 1 ? 's' : ''}.`);
    
    // Most and least effective medications
    if (medications.length > 1) {
      // Sort by effectiveness
      const sortedByEffectiveness = [...medications].sort((a, b) => b.effectiveness - a.effectiveness);
      
      const mostEffective = sortedByEffectiveness[0];
      summary.push(`${mostEffective.medicationName} appears to be the most effective medication with a ${mostEffective.effectiveness}% effectiveness rating.`);
      
      if (sortedByEffectiveness.length > 1) {
        const leastEffective = sortedByEffectiveness[sortedByEffectiveness.length - 1];
        if (leastEffective.effectiveness < 40) {
          summary.push(`${leastEffective.medicationName} shows lower effectiveness at ${leastEffective.effectiveness}% and may require reevaluation.`);
        }
      }
      
      // Add interaction check summary
      let hasInteractionWarning = false;
      for (const med of medications) {
        if (med.interactions && med.interactions.length > 0) {
          hasInteractionWarning = true;
          break;
        }
      }
      
      if (hasInteractionWarning) {
        summary.push(`Potential medication interactions detected. Please consult with your healthcare provider.`);
      }
      
      // Adherence insights
      const lowAdherence = medications.filter(m => m.adherence < 70);
      if (lowAdherence.length > 0) {
        const medicationNames = lowAdherence.map(m => m.medicationName).join(', ');
        summary.push(`Adherence could be improved for: ${medicationNames}.`);
      }
      
      // Side effects insights
      const withSideEffects = medications.filter(m => m.sideEffects.length > 0);
      if (withSideEffects.length > 0) {
        summary.push(`${withSideEffects.length} medication${withSideEffects.length > 1 ? 's have' : ' has'} recorded side effects that may warrant review.`);
      }
    } else {
      // Single medication
      const medication = medications[0];
      summary.push(`${medication.medicationName} has an estimated effectiveness rating of ${medication.effectiveness}% and adherence of ${medication.adherence}%.`);
      // Add interaction info if available
      if (medication.interactions && medication.interactions.length > 0) {
        summary.push(`Potential interactions noted: ${medication.interactions.join(', ')}.`);
      }
      // Add side effects info if available
      if (medication.sideEffects && medication.sideEffects.length > 0) {
        summary.push(`Side effects recorded: ${medication.sideEffects.join(', ')}.`);
      }
    }
  } catch (error) {
    console.error("Error generating medication summary:", error);
    if (summary.length === 0) {
      return "Error analyzing medication data. Please try again later.";
    }
    // If we already have some summary data, add an error note but return what we have
    summary.push("Note: Some medication analysis data may be incomplete.");
  }
  
  return summary.join(' ');
}

/**
 * Generate a summary for risk score calculation
 */
function generateRiskSummary(riskScore: RiskScore): string {
  let summary = `Your health risk score is ${riskScore.score} (${riskScore.level} risk).`;
  
  if (riskScore.factors.length > 0) {
    summary += ` Factors affecting your score: ${riskScore.factors.join(', ')}.`;
  }
  
  if (riskScore.recommendations.length > 0) {
    summary += ` Recommendations: ${riskScore.recommendations.join(', ')}.`;
  }
  
  return summary;
}
