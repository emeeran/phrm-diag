"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar } from "lucide-react";

export default function FamilyNavigation() {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <Tabs 
        defaultValue={pathname.includes('/timeline') ? 'timeline' : 'members'} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
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
        </TabsList>
      </Tabs>
    </div>
  );
}
