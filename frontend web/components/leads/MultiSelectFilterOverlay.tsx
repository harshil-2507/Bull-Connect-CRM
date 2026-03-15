"use client"

import { useState } from "react"
import { X } from "lucide-react"

type Props = {
  title: string
  options: string[]
  selected: string[]
  onApply: (values: string[]) => void
  onClose: () => void
}

export default function MultiSelectFilterOverlay({
  title,
  options,
  selected,
  onApply,
  onClose
}: Props) {

  const [search, setSearch] = useState("")
  const [localSelected, setLocalSelected] = useState<string[]>(selected)

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (value: string) => {

    if (localSelected.includes(value)) {
      setLocalSelected(localSelected.filter(v => v !== value))
    } else {
      setLocalSelected([...localSelected, value])
    }

  }

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/20"
        onClick={onClose}
      />

      <div className="relative w-[420px] bg-white rounded-xl shadow-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold">
          Filter {title}
        </h2>

        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder={`Search ${title}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {localSelected.length > 0 && (

          <div className="flex flex-wrap gap-2">

            {localSelected.map(tag => (

              <div
                key={tag}
                className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
              >

                {tag}

                <X
                  size={14}
                  className="cursor-pointer"
                  onClick={() => toggle(tag)}
                />

              </div>

            ))}

          </div>

        )}

        <div className="max-h-52 overflow-y-auto border rounded-md">

          {filtered.map(opt => (

            <div
              key={opt}
              onClick={() => toggle(opt)}
              className={`px-3 py-2 cursor-pointer text-sm hover:bg-muted ${
                localSelected.includes(opt) ? "bg-muted font-medium" : ""
              }`}
            >
              {opt}
            </div>

          ))}

        </div>

        <div className="flex justify-end gap-3 pt-2">

          <button
            className="text-sm text-muted-foreground"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="text-sm font-medium"
            onClick={() => {
              onApply(localSelected)
              onClose()
            }}
          >
            Apply
          </button>

        </div>

      </div>

    </div>
  )
}