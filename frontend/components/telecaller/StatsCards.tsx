// frontend/components/telecaller/StatsCards.tsx

"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function StatsCards({ stats }: any) {

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      {/* <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Calls Made</p>
          <h2 className="text-2xl font-bold">{stats?.calls_made || 0}</h2>
        </CardContent>
      </Card> */}

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Contacted</p>
          <h2 className="text-2xl font-bold">{stats?.contacted || 0}</h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Interested</p>
          <h2 className="text-2xl font-bold">{stats?.interested || 0}</h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Points </p>
          <h2 className="text-2xl font-bold">{stats?.points || 0}</h2>
        </CardContent>
      </Card>

    </div>
  )
}