'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SecuritySettings from './security-component';

export default function SecuritySettingsWrapper() {
  return (
    <Suspense fallback={<SecuritySettingsSkeleton />}>
      <SecuritySettings />
    </Suspense>
  );
}

function SecuritySettingsSkeleton() {
  return (
    <div className="container max-w-5xl py-10">
      <Skeleton className="h-10 w-64 mb-6" />
      <Skeleton className="h-12 w-full mb-8" />
      <Skeleton className="h-[300px] w-full mb-6" />
    </div>
  );
}
