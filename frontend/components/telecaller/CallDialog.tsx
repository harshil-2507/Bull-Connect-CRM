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
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue
} from "@/components/ui/select"

export default function CallDialog({ open, setOpen, lead, onSubmit }: any) {

  const [disposition, setDisposition] = useState("CALLBACK")
  const [cropType, setCropType] = useState("")
  const [acreage, setAcreage] = useState("")

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>Calling {lead.farmer_name}</DialogTitle>
        </DialogHeader>

        {/* STATUS SELECT */}
        <Select onValueChange={setDisposition}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="CALLBACK">Follow Up</SelectItem>
            <SelectItem value="INTERESTED">Interested</SelectItem>
            <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
          </SelectContent>
        </Select>

        {/*  SHOW EXTRA FIELDS ONLY FOR INTERESTED */}
        {disposition === "INTERESTED" && (
          <div className="space-y-2 mt-3">

            <input
              placeholder="Crop Type"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="border p-2 rounded w-full"
            />

            <input
              placeholder="Acreage"
              type="number"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              className="border p-2 rounded w-full"
            />

          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => {

              if (!disposition) {
                alert("Please select a disposition")
                return
              }

              if (disposition === "INTERESTED" && (!cropType || !acreage)) {
                alert("Please fill crop type and acreage")
                return
              }

              onSubmit({
                leadId: lead.id,
                disposition,
                cropType: disposition === "INTERESTED" ? cropType : undefined,
                acreage: disposition === "INTERESTED" ? Number(acreage) : undefined,
              })

              //  reset form
              setDisposition("")
              setCropType("")
              setAcreage("")
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