export const promptTemplates = {
  "health-risk-prediction": `Given the following health data, predict potential health risks for the user. Respond with a JSON array of RiskPrediction objects. 
  Health Data: {{healthData}}`,
  "health-recommendations": `Given the following health data, provide personalized health recommendations. Respond with a JSON array of HealthRecommendation objects. 
  Health Data: {{healthData}}`,
  "appointment-timing": `Given the following health data and appointment history, suggest optimal timing for future appointments. Respond with a JSON array of AppointmentTiming objects. 
  Health Data: {{healthData}}
  Appointment History: {{appointmentHistory}}`,
  "preventive-care": `Given the following health data, generate preventive care reminders. Respond with a JSON array of PreventiveCareReminder objects. 
  Health Data: {{healthData}}`,
  "health-milestones": `Given the following health data, identify and generate health milestones. Respond with a JSON array of HealthMilestoneAlert objects. 
  Health Data: {{healthData}}`,
  "wellness-goals": `Given the following health data, generate personalized wellness goals. Respond with a JSON array of WellnessGoalAlert objects. 
  Health Data: {{healthData}}`,
};
