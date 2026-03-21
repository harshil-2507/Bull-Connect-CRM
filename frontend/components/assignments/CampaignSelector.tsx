"use client"

import { useCampaigns } from "@/hooks/useCampaigns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function CampaignSelector({ value, onChange }: Props) {

  const { data: campaigns, isLoading } = useCampaigns()

  return (
    <div className="space-y-2">

      <label className="text-sm font-medium text-gray-700">
        Select Campaign
      </label>

      <Select value={value} onValueChange={onChange}>

        {/* ✅ FIX 1: proper styling */}
        <SelectTrigger className="bg-white text-gray-900 border">
          <SelectValue placeholder="Choose campaign" />
        </SelectTrigger>

        {/* ✅ FIX 2: z-index + bg + shadow */}
        <SelectContent
          className="z-[9999] bg-white text-gray-900 shadow-lg border"
          position="popper"
        >

          {isLoading && (
            <div className="p-2 text-sm text-gray-500">
              Loading...
            </div>
          )}

          {campaigns?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}

        </SelectContent>

      </Select>

    </div>
  )
}