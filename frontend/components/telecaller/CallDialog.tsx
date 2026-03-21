// frontend/components/telecaller/CallDialog.tsx

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select"

export default function CallDialog({ open, setOpen, lead, onSubmit }: any) {

  const [disposition, setDisposition] = useState("CONTACTED")

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>Calling {lead.farmer_name}</DialogTitle>
        </DialogHeader>

        <Select onValueChange={setDisposition}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
            <SelectItem value="INTERESTED">Interested</SelectItem>
            <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            onClick={() => {
              onSubmit({
                leadId: lead.id,
                disposition
              })
              setOpen(false)
            }}
          >
            Submit
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}