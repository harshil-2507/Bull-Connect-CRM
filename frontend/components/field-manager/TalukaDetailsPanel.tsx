"use client"

import { useTalukaDetails } from "@/hooks/useTalukaDetails"
import { useSmartAssign } from "@/hooks/useSmartAssign"
import { Button } from "@/components/ui/button"

export function TalukaDetailsPanel({ taluka }: { taluka: string }) {

  const { data, isLoading } = useTalukaDetails(taluka)
  const smartAssign = useSmartAssign()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-bold">
        {taluka} Details
      </h2>

      {/* SMART ASSIGN */}
      <Button
        onClick={() => smartAssign.mutate(taluka)}
        className="bg-blue-600"
      >
        Auto Assign Smart
      </Button>

      {/* REQUESTS */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Requests</h3>

        {data.requests.map((r: any) => (
          <div key={r.id} className="text-sm border-b py-1">
            {r.farmer_name} ({r.priority})
          </div>
        ))}
      </div>

      {/* EXECUTIVES */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Field Executives</h3>

        {data.fieldExecutives.map((e: any) => (
          <div key={e.id} className="text-sm border-b py-1">
            {e.name} | {e.current_load}/{e.capacity}
          </div>
        ))}
      </div>

    </div>
  )
}