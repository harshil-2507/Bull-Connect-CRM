"use client"

import { useTeamStatus } from "@/hooks/useTeamStatus"
import { Card } from "@/components/ui/card"

export function TeamStatusTable() {

  const { data, isLoading } = useTeamStatus()

  if (isLoading) return <div>Loading team...</div>

  return (
    <Card className="p-4">

      <h2 className="font-bold mb-3">
        Team Status
      </h2>

      {data?.map((t: any, i: number) => (
        <div key={i} className="flex justify-between border-b py-2 text-sm">

          <span>{t.name}</span>
          <span>{t.total_visits} visits</span>
          <span>{t.in_progress} active</span>

        </div>
      ))}

    </Card>
  )
}