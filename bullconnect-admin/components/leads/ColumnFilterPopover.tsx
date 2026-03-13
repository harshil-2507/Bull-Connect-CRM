"use client"

import { useState } from "react"

import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Props = {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

export default function ColumnFilterPopover({
  label,
  options,
  value,
  onChange
}: Props) {

  const [search, setSearch] = useState("")

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  return (

    <Popover>

      <PopoverTrigger className="flex items-center gap-1">

        {label}
        <span className="text-xs">▾</span>

      </PopoverTrigger>

      <PopoverContent className="w-64 p-4 space-y-3">

        <p className="text-sm font-medium">
          Filter {label}
        </p>

        <Input
          placeholder={`Search ${label}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-48 overflow-y-auto space-y-1">

          <button
            className="block text-left w-full px-2 py-1 rounded hover:bg-muted"
            onClick={() => onChange("")}
          >
            All
          </button>

          {filtered.map(opt => (

            <button
              key={opt}
              className={`block text-left w-full px-2 py-1 rounded hover:bg-muted ${
                value === opt ? "bg-muted font-medium" : ""
              }`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>

          ))}

        </div>

        <div className="flex justify-between pt-2">

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            Clear
          </Button>

          <Button size="sm">
            Apply
          </Button>

        </div>

      </PopoverContent>

    </Popover>

  )
}