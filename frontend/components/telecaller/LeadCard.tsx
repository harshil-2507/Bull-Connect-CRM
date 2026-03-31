"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LeadCard({ lead, onCall }: any) {

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-2">

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{lead.farmer_name}</h3>
        <Badge>{lead.status}</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {lead.phone_number}
      </p>

      <p className="text-sm text-muted-foreground">
        {lead.village}, {lead.taluka}
      </p>

      {lead.latest_tag && (
        <p className="text-xs text-blue-600">
          Tag: {lead.latest_tag}
        </p>
      )}

      <div className="flex gap-2 pt-2">

        <Button size="sm" onClick={() => onCall(lead)}>
          Call Now
        </Button>

        <Button size="sm" variant="outline">
          Info
        </Button>

      </div>

    </div>
  )
}