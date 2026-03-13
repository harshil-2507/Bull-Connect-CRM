"use client"

import { Lead } from "@/types/leads"
import { X } from "lucide-react"
import StatusBadge from "./StatusBadge"

type Props = {
  lead: Lead
  onClose: () => void
}

export default function LeadPreviewPanel({ lead, onClose }: Props) {

  return (

    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      />

      <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b">

          <h2 className="text-lg font-semibold">
            Lead Details
          </h2>

          <button onClick={onClose}>
            <X size={18}/>
          </button>

        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

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
              {lead.village ?? "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-muted-foreground">
              Status
            </p>

            <StatusBadge status={lead.status} />

          </div>

        </div>

      </div>
    </>
  )
}