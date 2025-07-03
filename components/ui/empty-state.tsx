import React from 'react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-10 text-center px-6">
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          {description}
        </p>
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
}
