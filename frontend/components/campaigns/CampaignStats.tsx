"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaigns } from "@/hooks/useCampaigns"

export default function CampaignStats() {

  const { data, isLoading } = useCampaigns()

  if (isLoading) return null

  const campaigns = data || []

  const total = campaigns.length
  const active = campaigns.filter((c:any) => c.status === "ACTIVE").length
  const draft = campaigns.filter((c:any) => c.status === "DRAFT").length
  const paused = campaigns.filter((c:any) => c.status === "PAUSED").length

  return (

    <div className="grid grid-cols-4 gap-4">

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">
            Total Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-black">
          {total}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">
            Active
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-green-600">
          {active}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">
            Draft
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-gray-700">
          {draft}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">
            Paused
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-orange-600">
          {paused}
        </CardContent>
      </Card>

    </div>

  )
}