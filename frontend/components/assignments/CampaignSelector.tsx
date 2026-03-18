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
      <label className="text-sm font-medium">
        Select Campaign
      </label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose campaign" />
        </SelectTrigger>

        <SelectContent>
          {isLoading && (
            <div className="p-2 text-sm">Loading...</div>
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