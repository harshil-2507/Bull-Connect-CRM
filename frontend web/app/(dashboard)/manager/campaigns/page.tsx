"use client"

import CampaignStats from "@/components/campaigns/CampaignStats"
import CampaignTable from "@/components/campaigns/CampaignTable"
import CreateCampaignDialog from "@/components/campaigns/CreateCampaignDialog"

export default function ManagerCampaignPage() {

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-semibold text-black">
            Campaigns
          </h1>

          <p className="text-gray-600">
            Manage tele-calling campaigns
          </p>

        </div>

        <CreateCampaignDialog />

      </div>

      <CampaignStats />

      <CampaignTable />

    </div>

  )
}