"use client"

import { Input } from "@/components/ui/input"

interface Telecaller {
  id: string
  name: string
}

interface Props {
  telecallers: Telecaller[]
  distribution: Record<string, number>
  setDistribution: (d: Record<string, number>) => void
}

export default function DistributionEditor({
  telecallers,
  distribution,
  setDistribution
}: Props) {

  const handleChange = (id: string, value: number) => {
    setDistribution({
      ...distribution,
      [id]: value
    })
  }

  return (
    <div className="space-y-2">
      {telecallers.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <div className="w-32 text-sm">{t.name}</div>

          <Input
            type="number"
            value={distribution[t.id] || 0}
            onChange={(e) =>
              handleChange(t.id, Number(e.target.value))
            }
          />
        </div>
      ))}
    </div>
  )
}