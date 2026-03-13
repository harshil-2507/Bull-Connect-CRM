"use client"

import { useLead } from "@/hooks/useLead"
import { useParams } from "next/navigation"

export default function LeadDetailPage() {
  const params = useParams()
  const { data, isLoading } = useLead(params.id as string)

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        {data?.farmer_name}
      </h1>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <b>Phone:</b> {data?.phone_number}
        </div>

        <div>
          <b>Village:</b> {data?.village}
        </div>

        <div>
          <b>District:</b> {data?.district}
        </div>

        <div>
          <b>Crop:</b> {data?.crop_type}
        </div>

      </div>
    </div>
  )
}