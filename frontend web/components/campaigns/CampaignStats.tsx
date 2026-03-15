"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignStats } from "@/hooks/useCampaignStats"

export default function CampaignStats() {

  const { data, isLoading } = useCampaignStats()

  if (isLoading) return null

  const total = data?.length || 0

  const active = data?.filter((c:any) => c.status === "ACTIVE").length || 0
  const draft = data?.filter((c:any) => c.status === "DRAFT").length || 0
  const paused = data?.filter((c:any) => c.status === "PAUSED").length || 0

  return (

    <div className="grid grid-cols-4 gap-4">

      <Card>
        <CardHeader>
          <CardTitle>Total Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {total}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-green-600">
          {active}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draft</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-gray-600">
          {draft}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paused</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-orange-600">
          {paused}
        </CardContent>
      </Card>

    </div>

  )
}