"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type Props = {
  selectedCount: number
  onClear: () => void
}

export default function BulkActionBar({
  selectedCount,
  onClear
}: Props) {

  if (selectedCount === 0) return null

  return (

    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border shadow-lg rounded-xl px-6 py-3 flex items-center gap-4 z-40">

      <span className="text-sm font-medium">
        {selectedCount} Leads Selected
      </span>

      <Button size="sm" variant="secondary">
        Assign
      </Button>

      <Button size="sm" variant="secondary">
        Mark Contacted
      </Button>

      <Button size="sm" variant="secondary">
        Export
      </Button>

      <Button size="sm" variant="destructive">
        Delete
      </Button>

      <button onClick={onClear}>
        <X size={16}/>
      </button>

    </div>

  )
}