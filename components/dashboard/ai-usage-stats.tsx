"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AIUsageStats {
  totalCost: number;
  tokenCount: number;
  usageCount: number;
  lastUsedAt: string;
  dailyUsage?: Array<{
    date: string;
    cost: number;
    tokens: number;
    count: number;
  }>;
  modelDistribution?: Array<{
    model: string;
    cost: number;
    count: number;
  }>;
}

export function AIUsageStats() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAIUsageStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/ai/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch AI usage statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching AI stats');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAIUsageStats();
  }, []);

  if (loading) {
    return <LoadingState message="Loading AI usage statistics..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Statistics</CardTitle>
          <CardDescription>No AI usage data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Start using the AI assistant to see your usage statistics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Overview</CardTitle>
          <CardDescription>Summary of your AI assistant usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Total Cost</p>
              <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">Total Tokens</p>
              <p className="text-2xl font-bold">{stats.tokenCount.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-600">Total Interactions</p>
              <p className="text-2xl font-bold">{stats.usageCount}</p>
            </div>
          </div>
          
          {stats.lastUsedAt && (
            <p className="text-sm text-gray-500 mt-4">
              Last used on {new Date(stats.lastUsedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {stats.dailyUsage && stats.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
            <CardDescription>Your AI usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyUsage}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'cost') return [`$${Number(value).toFixed(4)}`, 'Cost'];
                      if (name === 'tokens') return [Number(value).toLocaleString(), 'Tokens'];
                      if (name === 'count') return [value, 'Queries'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="cost" name="Cost" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.modelDistribution && stats.modelDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Distribution by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.modelDistribution.map((model) => (
                <div key={model.model} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{model.model}</span>
                    <span className="text-gray-600">{model.count} queries</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-500">Cost: ${model.cost.toFixed(4)}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round((model.count / stats.usageCount) * 100)}% of total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
