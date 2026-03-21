"use client"

import { Checkbox } from "@/components/ui/checkbox"

interface Telecaller {
  id: string
  name: string
}

interface Props {
  telecallers: Telecaller[]
  selected: string[]
  setSelected: (ids: string[]) => void
}

export default function TelecallerSelector({
  telecallers,
  selected,
  setSelected
}: Props) {

  const toggle = (id: string) => {

    if (selected.includes(id)) {
      setSelected(selected.filter(t => t !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  return (

    <div className="space-y-2">

      {/* LABEL */}
      <label className="text-sm font-medium text-gray-700">
        Select Telecallers
      </label>

      {/* LIST BOX */}
      <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-white text-gray-900 shadow-sm">

        {telecallers.length === 0 && (
          <div className="text-sm text-gray-500 p-2">
            No telecallers found
          </div>
        )}

        {telecallers.map((t) => (

          <div
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer transition 
              ${selected.includes(t.id)
                ? "bg-blue-50"
                : "hover:bg-gray-100"
              }`}
          >

            {/* CHECKBOX */}
            <Checkbox
              checked={selected.includes(t.id)}
              onCheckedChange={() => toggle(t.id)}
            />

            {/* NAME */}
            <span className="text-sm font-medium text-gray-900">
              {t.name}
            </span>

          </div>

        ))}

      </div>

      {/* FOOTER INFO */}
      <div className="text-xs text-gray-500">
        {selected.length} selected
      </div>

    </div>
  )
}