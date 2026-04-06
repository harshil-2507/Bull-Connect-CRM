"use client"

import { StatsCard } from "@/components/shared/StatsCard"
import { PhoneCall, UserCheck, Heart, Star } from "lucide-react"

export default function StatsCards({ stats }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard 
        title="Calls Made" 
        value={stats?.calls_made || 0} 
        icon={PhoneCall} 
      />
      <StatsCard 
        title="Contacted" 
        value={stats?.contacted || 0} 
        icon={UserCheck} 
      />
      <StatsCard 
        title="Interested" 
        value={stats?.interested || 0} 
        icon={Heart} 
      />
      <StatsCard 
        title="Points" 
        value={stats?.points || 0} 
        icon={Star} 
      />
    </div>
  )
}