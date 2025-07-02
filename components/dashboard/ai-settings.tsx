"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function AISettings() {
  const [defaultModel, setDefaultModel] = useState<string>("auto");
  const [costAware, setCostAware] = useState<boolean>(true);
  const [saveChats, setSaveChats] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  async function saveSettings() {
    try {
      setIsSaving(true);
      
      // In a real implementation, we'd save these settings to the database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Model Preferences</CardTitle>
          <CardDescription>Configure how the AI assistant works for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-model">Default AI Model</Label>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger id="default-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic (Cost-Optimized)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (More Capable)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Automatic mode uses complexity detection to route to the best model
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cost-aware">Cost-Aware Mode</Label>
              <p className="text-sm text-gray-500">
                Optimizes requests to minimize costs
              </p>
            </div>
            <Switch
              id="cost-aware"
              checked={costAware}
              onCheckedChange={setCostAware}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="save-chats">Save Chat History</Label>
              <p className="text-sm text-gray-500">
                Store conversations for context and review
              </p>
            </div>
            <Switch
              id="save-chats"
              checked={saveChats}
              onCheckedChange={setSaveChats}
            />
          </div>
          
          <Button 
            onClick={saveSettings} 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Information</CardTitle>
          <CardDescription>About your AI health assistant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Available Models</h3>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li className="flex justify-between">
                <span>GPT-3.5 Turbo</span>
                <span className="text-gray-500">Fast, cost-effective</span>
              </li>
              <li className="flex justify-between">
                <span>GPT-4</span>
                <span className="text-gray-500">Advanced medical knowledge</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">Cost Information</h3>
            <p className="text-sm text-gray-600 mt-1">
              Costs are calculated per token used. The system automatically optimizes
              to use the most cost-effective model that meets your needs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
