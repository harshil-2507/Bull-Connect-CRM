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
      <label className="text-sm font-medium">
        Select Telecallers
      </label>

      <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">

        {telecallers.map((t) => (

          <div
            key={t.id}
            className="flex items-center gap-2 py-1"
          >
            <Checkbox
              checked={selected.includes(t.id)}
              onCheckedChange={() => toggle(t.id)}
            />

            <span className="text-sm">
              {t.name}
            </span>
          </div>

        ))}

      </div>
    </div>
  )
}