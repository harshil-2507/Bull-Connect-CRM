"use client"

import { useState } from "react"
import { useCreateCampaign } from "@/hooks/useCreateCampaign"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@/components/ui/dialog"

export default function CreateCampaignDialog() {

  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const createCampaign = useCreateCampaign()

  const handleSubmit = async () => {

    if (!name) return

    await createCampaign.mutateAsync({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
    })

    setOpen(false)

    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
  }

  return (

    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button>
          Create Campaign
        </Button>
      </DialogTrigger>

      {/* Background overlay */}
      <DialogOverlay className="bg-black/70 backdrop-blur-sm" />

      <DialogContent className="sm:max-w-[520px] bg-white shadow-xl">

        <DialogHeader>
          <DialogTitle>
            Create Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Campaign Name */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              Campaign Name
            </label>

            <Input
              placeholder="Enter campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

          </div>

          {/* Description */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              Description
            </label>

            <Input
              placeholder="Campaign description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

          </div>

          {/* Start Date */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              Start Date
            </label>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

          </div>

          {/* End Date */}
          <div className="space-y-2">

            <label className="text-sm font-medium">
              End Date
            </label>

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createCampaign.isPending}
          >
            {createCampaign.isPending
              ? "Creating..."
              : "Create Campaign"}
          </Button>

        </div>

      </DialogContent>

    </Dialog>

  )
}