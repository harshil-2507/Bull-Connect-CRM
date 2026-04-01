"use client"

import { useFieldMap } from "@/hooks/useFieldMap"
import { Card } from "@/components/ui/card"

export function TalukaMap({ onSelectTaluka }: any) {
  const { data, isLoading } = useFieldMap()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-4 gap-4">

      {data?.map((t: any) => (
        <Card
          key={t.taluka}
          className="p-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => onSelectTaluka(t.taluka)}
        >
          <h2 className="font-bold">{t.taluka}</h2>
          <p>{t.total_requests} requests</p>
        </Card>
      ))}

    </div>
  )
}