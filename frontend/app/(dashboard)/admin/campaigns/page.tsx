"use client"

import CampaignStats from "@/components/campaigns/CampaignStats"
import CampaignTable from "@/components/campaigns/CampaignTable"
import CreateCampaignDialog from "@/components/campaigns/CreateCampaignDialog"
import { Rocket } from "lucide-react"

export default function CampaignPage() {

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                  Campaigns Management
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">
                  Strategic outreach and performance harvesting.
              </p>
          </div>

          <CreateCampaignDialog />
      </div>

      {/* KPI Section */}
      <CampaignStats />

      {/* Table Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 px-2 tracking-tight flex items-center gap-2">
            <Rocket className="text-blue-600" size={24} />
            Active Harvests
        </h2>
        <CampaignTable />
      </div>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10">
          Bull Connect © 2026. All campaign data processed with precision.
      </div>
    </div>
  )
}