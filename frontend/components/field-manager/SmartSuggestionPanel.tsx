"use client"

import { useSuggestions } from "@/hooks/useSuggestions"
import { Card } from "@/components/ui/card"

export function SmartSuggestionPanel({ taluka }: { taluka: string }) {

  const { data, isLoading } = useSuggestions(taluka)

  if (isLoading) return <div>Loading suggestions...</div>

  return (
    <Card className="p-4 space-y-3">

      <h2 className="font-bold">
        Smart Suggestions
      </h2>

      {data?.suggestions?.map((s: any) => (
        <div key={s.execId} className="text-sm border-b pb-2">

          <div className="font-semibold">
            {s.name}
          </div>

          <div>
            Assign: {s.assignCount}
          </div>

          <div className="text-gray-500 text-xs">
            {s.reason}
          </div>

        </div>
      ))}

      <div className="text-sm text-red-500">
        {data?.message}
      </div>

    </Card>
  )
}