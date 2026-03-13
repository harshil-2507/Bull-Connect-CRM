"use client"

import { Lead } from "@/types/leads"
import { X } from "lucide-react"

import StatusBadge from "./StatusBadge"
import ActivityTimeline from "./ActivityTimeline"

type Props = {
  lead: Lead
  onClose: () => void
}

export default function LeadPreviewPanel({ lead, onClose }: Props) {

  return (

    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex justify-end"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] h-full bg-white shadow-xl p-6 overflow-y-auto"
      >

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-lg font-semibold">
            Lead Details
          </h2>

          <button onClick={onClose}>
            <X size={18} />
          </button>

        </div>

        <div className="space-y-4">

          <div>
            <p className="text-sm text-muted-foreground">
              Farmer Name
            </p>
            <p className="font-medium">
              {lead.farmer_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Phone
            </p>
            <p className="font-medium">
              {lead.phone_number}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Village
            </p>
            <p className="font-medium">
              {lead.village || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Status
            </p>
            <StatusBadge status={lead.status} />
          </div>

        </div>

        <div className="mt-8">

          <h3 className="text-sm font-semibold mb-3">
            Activity Timeline
          </h3>

          <ActivityTimeline lead={lead} />

        </div>

      </div>

    </div>

  )

}