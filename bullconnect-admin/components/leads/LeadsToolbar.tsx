"use client"

import React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Props = {
  search: string
  setSearch: (v: string) => void
  status: string
  setStatus: (v: string) => void
}

export default function LeadsToolbar({
  search,
  setSearch,
  status,
  setStatus,
}: Props) {

  const statuses = [
    "ALL",
    "ASSIGNED",
    "CONTACTED",
    "VISIT_REQUESTED",
    "VISIT_COMPLETED",
    "SOLD",
  ]

  return (
    <div className="flex items-center gap-6 flex-wrap">

      {/* Search */}
      <div className="relative w-80">

        <Search
          size={16}
          className="absolute left-3 top-3 text-muted-foreground"
        />

        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          placeholder="Search farmer, phone..."
          className="pl-9"
        />

      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">

        {statuses.map((s) => (

          <Button
            key={s}
            size="sm"
            className="rounded-full"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s.replace("_", " ")}
          </Button>

        ))}

      </div>

    </div>
  )
}