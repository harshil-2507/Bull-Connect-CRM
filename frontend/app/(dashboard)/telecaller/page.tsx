// frontend/app/(dashboard)/telecaller/page.tsx

"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"

import {
  useWorkQueue,
  useStats,
  // useLeaderboard,
  useCall
} from "@/hooks/useTelecaller"

import StatsCards from "@/components/telecaller/StatsCards"
import WorkQueue from "@/components/telecaller/WorkQueue"
import CallDialog from "@/components/telecaller/CallDialog"

export default function TelecallerPage() {

  useAuth()

  const { data: queue } = useWorkQueue()
  const { data: stats } = useStats()
  const { mutate: callLead } = useCall()

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Queue */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          My To-Do List ({queue?.total || 0})
        </h2>

        <WorkQueue
          data={queue?.data}
          onCall={(lead: any) => {
            setSelectedLead(lead)
            setOpen(true)
          }}
        />
      </div>

      {/* Call Dialog */}
      <CallDialog
        open={open}
        setOpen={setOpen}
        lead={selectedLead}
        onSubmit={(payload: any) => {
          callLead(payload)
        }}
      />

    </div>
  )
}