"use client"

import { useCampaigns } from "@/hooks/useCampaigns"
import { StatsCard } from "@/components/shared/StatsCard"
import { Megaphone, CheckCircle, FileText, PauseCircle } from "lucide-react"

export default function CampaignStats() {
    const { data, isLoading } = useCampaigns()

    if (isLoading) return null

    const campaigns = data || []
    const total = campaigns.length
    const active = campaigns.filter((c:any) => c.status === "ACTIVE").length
    const draft = campaigns.filter((c:any) => c.status === "DRAFT").length
    const paused = campaigns.filter((c:any) => c.status === "PAUSED").length

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
                title="Total Campaigns" 
                value={total} 
                icon={Megaphone} 
            />
            <StatsCard 
                title="Active" 
                value={active} 
                icon={CheckCircle} 
            />
            <StatsCard 
                title="Draft" 
                value={draft} 
                icon={FileText} 
            />
            <StatsCard 
                title="Paused" 
                value={paused} 
                icon={PauseCircle} 
            />
        </div>
    )
}