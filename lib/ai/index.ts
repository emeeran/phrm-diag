import { AIService } from './ai-service';
import { promptTemplates } from './prompt-templates';

const aiService = new AIService();

export function generatePrompt(templateName: keyof typeof promptTemplates, data: any): string {
  const template = promptTemplates[templateName];
  if (!template) {
    throw new Error(`Prompt template not found: ${templateName}`);
  }

  return template.replace(/\{\{(\w+)\}\} /g, (_, key) => {
    return data[key] || '';
  });
}

export async function getAICompletion(prompt: string, options?: any): Promise<string> {
  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  const result = await aiService.routeChat(messages, '', options);
  return result.response;
}

export * from './ai-service';
export * from './ai-types';
