"use client"

import { useState, useMemo } from "react"

import { useAssignLeadsBulk } from "@/hooks/useAssignLeadsBulk"
import { useTelecallers } from "@/hooks/useTelecallers"
import { useUnassignedLeads } from "@/hooks/useUnassignedLeads"

import CampaignSelector from "./CampaignSelector"
import AssignmentModeToggle, { AssignmentMode } from "./AssignmentModeToggle"
import DistributionEditor from "./DistributionEditor"
import AssignmentPreview from "./AssignmentPreview"
import TelecallerSelector from "./TelecallerSelector"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

export default function AssignLeadsDialog() {

  const [open, setOpen] = useState(false)
  const [campaignId, setCampaignId] = useState("")
  const [mode, setMode] = useState<AssignmentMode>("AUTO")

  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [selectedTelecallers, setSelectedTelecallers] = useState<string[]>([])

  // ✅ FIX: fetch telecallers FIRST
  const { data: telecallers = [] } = useTelecallers()
  const { data: leads = [] } = useUnassignedLeads(campaignId)

  const assignMutation = useAssignLeadsBulk()

  // ✅ FILTER SELECTED TELECALLERS
  const selectedTelecallerObjects = telecallers.filter(t =>
    selectedTelecallers.includes(t.id)
  )

  // ===============================
  // AUTO DISTRIBUTION
  // ===============================
  const autoDistribution = useMemo(() => {

    if (!selectedTelecallerObjects.length || !leads.length) return {}

    const perUser = Math.floor(leads.length / selectedTelecallerObjects.length)
    const remainder = leads.length % selectedTelecallerObjects.length

    const dist: Record<string, number> = {}

    selectedTelecallerObjects.forEach((t, i) => {
      dist[t.id] = perUser + (i < remainder ? 1 : 0)
    })

    return dist

  }, [selectedTelecallerObjects, leads]) // ✅ FIX dependency

  // ===============================
  const finalDistribution =
    mode === "AUTO" ? autoDistribution : distribution

  // ===============================
  const handleAssign = async () => {

    if (!leads.length || !selectedTelecallerObjects.length) return

    const assignments: { leadId: string; userId: string }[] = []

    let leadIndex = 0

    for (const userId of Object.keys(finalDistribution)) {

      const count = finalDistribution[userId] ?? 0

      for (let i = 0; i < count; i++) {

        const lead = leads[leadIndex]
        if (!lead) break

        assignments.push({
          leadId: lead.id,
          userId
        })

        leadIndex++
      }
    }

    await assignMutation.mutateAsync(assignments)
    setOpen(false)
  }

  // ===============================
  const totalManualAssigned = Object.values(distribution)
    .reduce((a, b) => a + b, 0)

  const isInvalidManual =
    mode === "MANUAL" &&
    totalManualAssigned !== leads.length

  const noTelecallerSelected = selectedTelecallers.length === 0

  return (

    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button>Assign Leads</Button>
      </DialogTrigger>

      <DialogContent className="bg-white max-w-xl">

        <DialogHeader>
          <DialogTitle>Assign Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Campaign */}
          <CampaignSelector
            value={campaignId}
            onChange={setCampaignId}
          />

          {/* ✅ Telecaller Selector */}
          <TelecallerSelector
            telecallers={telecallers}
            selected={selectedTelecallers}
            setSelected={setSelectedTelecallers}
          />

          {/* Stats */}
          <div className="text-sm text-gray-500">
            {leads.length} unassigned leads
          </div>

          <div className="text-sm text-gray-500">
            {selectedTelecallerObjects.length} selected telecallers
          </div>

          {/* Mode */}
          <AssignmentModeToggle
            mode={mode}
            setMode={setMode}
          />

          {/* Manual */}
          {mode === "MANUAL" && (
            <DistributionEditor
              telecallers={selectedTelecallerObjects}
              distribution={distribution}
              setDistribution={setDistribution}
            />
          )}

          {/* Preview */}
          <AssignmentPreview
            distribution={finalDistribution}
            totalLeads={leads.length}
          />

          {/* Error */}
          {isInvalidManual && (
            <div className="text-sm text-red-500">
              Total assigned must equal total leads
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleAssign}
            disabled={
              assignMutation.isPending ||
              isInvalidManual ||
              !campaignId ||
              noTelecallerSelected
            }
          >
            {assignMutation.isPending
              ? "Assigning..."
              : "Assign Leads"}
          </Button>

        </div>

      </DialogContent>

    </Dialog>
  )
}