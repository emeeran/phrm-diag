/**
 * Health Analytics Visualization Library
 * 
 * This library provides helper functions to transform analytical data
 * into formats suitable for various chart types.
 */

import { TrendPoint, RiskScore, MedicationEffectiveness, SymptomPattern } from './analytics';

/**
 * Chart data for line/area charts
 */
export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

/**
 * Chart data for bar charts
 */
export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[] | string;
    borderColor?: string[] | string;
    borderWidth?: number;
  }[];
}

/**
 * Chart data for pie/doughnut charts
 */
export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

/**
 * Chart data for radar charts
 */
export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

/**
 * Chart data for heat maps
 */
export interface HeatMapData {
  data: Array<[string, string, number]>; // [x, y, value]
  xLabels: string[];
  yLabels: string[];
}

/**
 * Convert health trends to line chart data
 */
export function trendsToLineChart(trends: TrendPoint[]): LineChartData {
  // Group trends by category
  const categories = Array.from(new Set(trends.map(t => t.category)));
  const dateSet = new Set(trends.map(t => t.date));
  const dates = Array.from(dateSet).sort();

  const datasets = categories.map(category => {
    const categoryTrends = trends.filter(t => t.category === category);
    const data = dates.map(date => {
      const point = categoryTrends.find(t => t.date === date);
      return point ? point.value : null;
    });

    // Generate a deterministic color based on the category name
    const hue = Math.abs(category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
    const color = `hsl(${hue}, 70%, 50%)`;

    return {
      label: category,
      data: data.filter(d => d !== null) as number[],
      borderColor: color,
      backgroundColor: `${color}33`, // Add transparency
      fill: true,
    };
  });

  return {
    labels: dates,
    datasets,
  };
}

/**
 * Convert health trends to bar chart data
 */
export function trendsToBarChart(trends: TrendPoint[]): BarChartData {
  // Group trends by date
  const categories = Array.from(new Set(trends.map(t => t.category)));
  const dateSet = new Set(trends.map(t => t.date));
  const dates = Array.from(dateSet).sort();

  const datasets = categories.map(category => {
    const categoryTrends = trends.filter(t => t.category === category);
    const data = dates.map(date => {
      const point = categoryTrends.find(t => t.date === date);
      return point ? point.value : 0;
    });

    // Generate a deterministic color
    const hue = Math.abs(category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
    const color = `hsl(${hue}, 70%, 50%)`;

    return {
      label: category,
      data,
      backgroundColor: color,
    };
  });

  return {
    labels: dates,
    datasets,
  };
}

/**
 * Convert risk score to radar chart data
 */
export function riskScoreToRadarChart(risk: RiskScore): RadarChartData {
  // Define risk dimensions
  const dimensions = ['Overall', 'Cardiac', 'Metabolic', 'Lifestyle', 'Age', 'Genetics'];
  
  // Map risk factors to dimensions
  const dimensionScores = dimensions.map(dimension => {
    switch (dimension) {
      case 'Overall':
        return risk.score;
      case 'Cardiac':
        return risk.factors.some(f => 
          f.toLowerCase().includes('heart') || 
          f.toLowerCase().includes('blood pressure') ||
          f.toLowerCase().includes('cholesterol')
        ) ? 70 : 30;
      case 'Metabolic':
        return risk.factors.some(f => 
          f.toLowerCase().includes('diabetes') || 
          f.toLowerCase().includes('glucose') ||
          f.toLowerCase().includes('metabolic')
        ) ? 65 : 25;
      case 'Lifestyle':
        return risk.factors.some(f => 
          f.toLowerCase().includes('smoking') || 
          f.toLowerCase().includes('alcohol') ||
          f.toLowerCase().includes('sedentary')
        ) ? 80 : 20;
      default:
        return risk.score / 2;
    }
  });

  return {
    labels: dimensions,
    datasets: [
      {
        label: 'Risk Profile',
        data: dimensionScores,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: true,
      }
    ],
  };
}

/**
 * Convert medication effectiveness to pie chart data
 */
export function medicationToPieChart(medications: MedicationEffectiveness[]): PieChartData {
  const sortedMeds = [...medications].sort((a, b) => b.effectiveness - a.effectiveness);
  const labels = sortedMeds.map(med => med.medicationName);
  const data = sortedMeds.map(med => med.effectiveness);
  
  // Generate colors
  const backgroundColors = sortedMeds.map((_, i) => {
    const hue = (i * 137.5) % 360; // Golden ratio to distribute colors
    return `hsl(${hue}, 70%, 60%)`;
  });
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: 'white',
        borderWidth: 1,
      }
    ],
  };
}

/**
 * Convert medication adherence to bar chart data
 */
export function medicationAdherenceToBarChart(medications: MedicationEffectiveness[]): BarChartData {
  const labels = medications.map(med => med.medicationName);
  const adherenceData = medications.map(med => med.adherence);
  const effectivenessData = medications.map(med => med.effectiveness);
  
  return {
    labels,
    datasets: [
      {
        label: 'Adherence',
        data: adherenceData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Effectiveness',
        data: effectivenessData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      }
    ],
  };
}

/**
 * Convert symptom patterns to various chart formats
 */
export function symptomPatternsToCharts(symptoms: SymptomPattern[]) {
  // Return multiple chart formats for different visualizations
  return {
    frequency: symptomFrequencyToBarChart(symptoms),
    intensity: symptomIntensityToBarChart(symptoms),
    correlations: symptomCorrelationsToHeatMap(symptoms),
  };
}

/**
 * Convert symptom frequency to bar chart data
 */
export function symptomFrequencyToBarChart(symptoms: SymptomPattern[]): BarChartData {
  const sortedSymptoms = [...symptoms].sort((a, b) => b.frequency - a.frequency);
  const labels = sortedSymptoms.map(s => s.symptom);
  const data = sortedSymptoms.map(s => s.frequency);
  
  // Generate colors based on frequency
  const maxFrequency = Math.max(...data);
  const backgroundColors = data.map(value => {
    const intensity = 100 - ((value / maxFrequency) * 50);
    return `hsl(0, 80%, ${intensity}%)`; // Red with varying intensity
  });

  return {
    labels,
    datasets: [
      {
        label: 'Frequency',
        data,
        backgroundColor: backgroundColors,
      }
    ],
  };
}

/**
 * Convert symptom intensity to bar chart data
 */
export function symptomIntensityToBarChart(symptoms: SymptomPattern[]): BarChartData {
  const sortedSymptoms = [...symptoms].sort((a, b) => b.intensity - a.intensity);
  const labels = sortedSymptoms.map(s => s.symptom);
  const data = sortedSymptoms.map(s => s.intensity);
  
  // Generate colors based on intensity
  const backgroundColors = data.map(value => {
    const hue = 120 - (value * 12); // Go from green (120) to red (0)
    return `hsl(${hue}, 70%, 50%)`;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Intensity (1-10)',
        data,
        backgroundColor: backgroundColors,
      }
    ],
  };
}

/**
 * Convert symptom correlations to heat map data
 */
export function symptomCorrelationsToHeatMap(symptoms: SymptomPattern[]): HeatMapData {
  // Get top symptoms
  const topSymptoms = [...symptoms]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(s => s.symptom);
  
  // Get all factors
  const allFactors = new Set<string>();
  for (const symptom of symptoms) {
    for (const corr of symptom.correlations) {
      allFactors.add(corr.factor);
    }
  }
  
  // Get top factors
  const topFactors = Array.from(allFactors).slice(0, 10);
  
  // Create data for the heatmap
  const data: Array<[string, string, number]> = [];
  
  for (const symptom of symptoms.filter(s => topSymptoms.includes(s.symptom))) {
    for (const factor of topFactors) {
      const correlation = symptom.correlations.find(c => c.factor === factor);
      data.push([
        symptom.symptom,
        factor,
        correlation ? correlation.strength * 100 : 0
      ]);
    }
  }
  
  return {
    data,
    xLabels: topSymptoms,
    yLabels: topFactors,
  };
}

/**
 * Convert trend data to calendar heatmap format
 * (for libraries like react-calendar-heatmap)
 */
export function trendsToCalendarData(trends: TrendPoint[]) {
  const result = trends.map(trend => ({
    date: trend.date,
    count: trend.value,
    category: trend.category,
  }));
  
  return result;
}

/**
 * Convert symptom patterns to heat map data
 */
export function symptomsToHeatMap(symptoms: SymptomPattern[]): HeatMapData {
  // Create a matrix of symptoms vs factors
  const allSymptoms = symptoms.map(s => s.symptom);
  
  // Collect all unique correlation factors
  const allFactorsSet = new Set<string>();
  symptoms.forEach(s => {
    s.correlations.forEach(c => allFactorsSet.add(c.factor));
  });
  
  const allFactors = Array.from(allFactorsSet);
  
  // Create data array [symptom, factor, strength]
  const data: Array<[string, string, number]> = [];
  
  for (const symptom of symptoms) {
    for (const factor of allFactors) {
      const correlation = symptom.correlations.find(c => c.factor === factor);
      if (correlation) {
        data.push([symptom.symptom, factor, correlation.strength * 100]);
      } else {
        data.push([symptom.symptom, factor, 0]);
      }
    }
  }
  
  return {
    data,
    xLabels: allFactors,
    yLabels: allSymptoms,
  };
}

/**
 * Generate symptom frequency bar chart
 */
export function symptomsToFrequencyChart(symptoms: SymptomPattern[]): BarChartData {
  // Sort by frequency, highest first
  const sortedSymptoms = [...symptoms].sort((a, b) => b.frequency - a.frequency);
  
  return {
    labels: sortedSymptoms.map(s => s.symptom),
    datasets: [
      {
        label: 'Frequency',
        data: sortedSymptoms.map(s => s.frequency),
        backgroundColor: sortedSymptoms.map((_, i) => 
          `hsl(${220 - i * 10}, 70%, 50%)`
        ),
      }
    ],
  };
}

/**
 * Generate symptom intensity bar chart
 */
export function symptomsToIntensityChart(symptoms: SymptomPattern[]): BarChartData {
  // Sort by intensity, highest first
  const sortedSymptoms = [...symptoms].sort((a, b) => b.intensity - a.intensity);
  
  return {
    labels: sortedSymptoms.map(s => s.symptom),
    datasets: [
      {
        label: 'Average Intensity',
        data: sortedSymptoms.map(s => Math.round(s.intensity * 10) / 10), // Round to 1 decimal
        backgroundColor: sortedSymptoms.map((_, i) => 
          `hsl(${360 - i * 15}, 70%, 50%)`
        ),
      }
    ],
  };
}

/**
 * Generate chart configuration for risk score
 */
export function riskScoreToPieChart(risk: RiskScore): PieChartData {
  return {
    labels: ['Risk Score', 'Safe Zone'],
    datasets: [
      {
        data: [risk.score, 100 - risk.score],
        backgroundColor: [
          `hsl(${Math.max(0, 120 - risk.score * 1.2)}, 70%, 50%)`, // Red to green based on score
          '#e0e0e0', // Gray for the safe zone
        ],
        borderColor: 'white',
        borderWidth: 1,
      }
    ],
  };
}

/**
 * Generate medication adherence chart
 */
export function medicationToAdherenceChart(medications: MedicationEffectiveness[]): BarChartData {
  const sortedMeds = [...medications].sort((a, b) => b.adherence - a.adherence);
  
  return {
    labels: sortedMeds.map(m => m.medicationName),
    datasets: [
      {
        label: 'Adherence (%)',
        data: sortedMeds.map(m => m.adherence),
        backgroundColor: sortedMeds.map(m => 
          `hsl(${m.adherence * 1.2}, 70%, 50%)`
        ),
      }
    ],
  };
}

/**
 * Format medication side effects for display
 */
export function formatMedicationSideEffects(medications: MedicationEffectiveness[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  for (const med of medications) {
    result[med.medicationName] = med.sideEffects;
  }
  
  return result;
}

/**
 * Generate summary statistics from trends
 */
export function generateTrendStatistics(trends: TrendPoint[]): Record<string, any> {
  // Group trends by category
  const categorizedTrends: Record<string, TrendPoint[]> = {};
  
  for (const trend of trends) {
    if (!categorizedTrends[trend.category]) {
      categorizedTrends[trend.category] = [];
    }
    categorizedTrends[trend.category].push(trend);
  }
  
  const result: Record<string, any> = {};
  
  // Calculate statistics for each category
  for (const [category, categoryTrends] of Object.entries(categorizedTrends)) {
    const values = categoryTrends.map(t => t.value);
    
    // Skip categories with no data
    if (values.length === 0) continue;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Sort to find median
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
    
    result[category] = {
      min,
      max,
      average: Math.round(avg * 10) / 10,
      median: Math.round(median * 10) / 10,
      count: values.length,
    };
  }
  
  return result;
}
