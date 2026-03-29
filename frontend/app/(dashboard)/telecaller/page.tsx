"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"

import {
  useWorkQueue,
  useStats,
  useCall
} from "@/hooks/useTelecaller"

import StatsCards from "@/components/telecaller/StatsCards"
import WorkQueue from "@/components/telecaller/WorkQueue"
import CallDialog from "@/components/telecaller/CallDialog"

export default function TelecallerPage() {

  const { loading } = useAuth() // ✅ updated

  const { data: queue } = useWorkQueue()
  const { data: stats } = useStats()
  const { mutate: callLead } = useCall()

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [open, setOpen] = useState(false)

  // ✅ prevent flicker + redirect loop
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking auth...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <StatsCards stats={stats} />

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