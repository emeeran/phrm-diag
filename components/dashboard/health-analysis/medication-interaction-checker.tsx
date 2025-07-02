"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState, InlineLoading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-boundary';
import { X, Plus, AlertTriangle } from 'lucide-react';

interface Medication {
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

interface InteractionResult {
  interactions: MedicationInteraction[];
  summary: string;
  disclaimer: string;
  error?: string;
}

export function MedicationInteractionChecker() {
  const [medications, setMedications] = useState<Medication[]>([{ name: '' }]);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedication = () => {
    setMedications([...medications, { name: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      const updatedMeds = [...medications];
      updatedMeds.splice(index, 1);
      setMedications(updatedMeds);
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMeds = [...medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setMedications(updatedMeds);
  };

  const checkInteractions = async () => {
    // Validate medications
    const validMeds = medications.filter(med => med.name.trim() !== '');
    if (validMeds.length < 2) {
      setError('Please enter at least two medications to check for interactions.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/ai/analysis/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications: validMeds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check interactions');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error checking medication interactions:', err);
      setError(err.message || 'Failed to check medication interactions');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medication Interaction Checker</CardTitle>
          <CardDescription>Check for potential interactions between medications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {medications.map((med, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`medication-${index}`}>Medication {index + 1}</Label>
                  <Input
                    id={`medication-${index}`}
                    value={med.name}
                    onChange={e => updateMedication(index, 'name', e.target.value)}
                    placeholder="Enter medication name"
                    className="mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={med.dosage || ''}
                      onChange={e => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="Dosage (optional)"
                      className="text-sm"
                    />
                    <Input
                      value={med.frequency || ''}
                      onChange={e => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="Frequency (optional)"
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeMedication(index)} 
                  disabled={medications.length === 1}
                  className="mb-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={addMedication} 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Medication
            </Button>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={checkInteractions} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? <InlineLoading /> : 'Check Interactions'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {loading && <LoadingState message="Checking medication interactions..." variant="icon" />}
      
      {result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Interaction Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{result.summary}</p>
            
            {result.interactions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Potential Interactions</h3>
                {result.interactions.map((interaction, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(interaction.severity)}>
                        {interaction.severity} severity
                      </Badge>
                      <span className="text-sm">
                        Between: <strong>{interaction.medications.join(' & ')}</strong>
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{interaction.description}</p>
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      <span className="font-medium">Recommendation: </span>
                      {interaction.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-green-800">No significant interactions were found between these medications.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500 flex-col items-start">
            <p className="mb-1">{result.disclaimer}</p>
            <p>Always consult with a healthcare professional about medication interactions.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
