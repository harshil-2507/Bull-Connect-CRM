"use client"

import { useEffect, useState } from "react"
import { TalukaMap } from "@/components/field-manager/TalukaMap"
import { TalukaDetailsPanel } from "@/components/field-manager/TalukaDetailsPanel"
import { SmartSuggestionPanel } from "@/components/field-manager/SmartSuggestionPanel"
import { TeamStatusTable } from "@/components/field-manager/TeamStatusTable"
import { useFieldMap } from "@/hooks/useFieldMap"

export default function FieldManagerPage() {

  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null)

  const { data } = useFieldMap()

  // AUTO SELECT FIRST TALUKA
  useEffect(() => {
    if (!selectedTaluka && data?.length > 0) {
      setSelectedTaluka(data[0].taluka)
    }
  }, [data])

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Ground Manager Dashboard
      </h1>

      {/* MAP */}
      <TalukaMap onSelectTaluka={setSelectedTaluka} />

      {/* DETAILS */}
      {selectedTaluka ? (
        <div className="grid grid-cols-3 gap-6">

          <div className="col-span-2">
            <TalukaDetailsPanel taluka={selectedTaluka} />
          </div>

          <div>
            <SmartSuggestionPanel taluka={selectedTaluka} />
          </div>

        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          No visit requests available
        </div>
      )}

      {/* TEAM STATUS */}
      <TeamStatusTable />

    </div>
  )
}