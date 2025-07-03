"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, TrendingUp } from "lucide-react";

export default function FamilyNavigation() {
  const pathname = usePathname();

  // Determine active tab
  const getActiveTab = () => {
    if (pathname.includes('/timeline')) return 'timeline';
    if (pathname.includes('/insights')) return 'insights';
    return 'members';
  };

  return (
    <div className="mb-8">
      <Tabs 
        defaultValue={getActiveTab()} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <Link href="/dashboard/family">
            <TabsTrigger 
              value="members" 
              className={pathname === "/dashboard/family" ? "data-[state=active]" : ""}
            >
              <Users className="w-4 h-4 mr-2" />
              Family Members
            </TabsTrigger>
          </Link>
          <Link href="/dashboard/family/timeline">
            <TabsTrigger 
              value="timeline" 
              className={pathname.includes('/timeline') ? "data-[state=active]" : ""}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Health Timeline
            </TabsTrigger>
          </Link>
          <Link href="/dashboard/family/insights">
            <TabsTrigger 
              value="insights" 
              className={pathname.includes('/insights') ? "data-[state=active]" : ""}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Health Insights
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
    </div>
  );
}
