"use client"

import { useEffect, useState } from "react"
import { TalukaMap } from "@/components/field-manager/TalukaMap"
import { TalukaDetailsPanel } from "@/components/field-manager/TalukaDetailsPanel"
import { SmartSuggestionPanel } from "@/components/field-manager/SmartSuggestionPanel"
import { TeamStatusTable } from "@/components/field-manager/TeamStatusTable"
import { useFieldMap } from "@/hooks/useFieldMap"
import { Sparkles, MapPin, Layers, Activity, Users } from "lucide-react"

export default function FieldManagerPage() {

  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null)
  const { data } = useFieldMap()

  useEffect(() => {
    if (!selectedTaluka && data?.length > 0) {
      setSelectedTaluka(data[0].taluka)
    }
  }, [data])

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10 selection:bg-blue-100 selection:text-blue-700">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <Sparkles className="text-blue-600" size={32} />
             Ground Manager Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
             Map-based team status monitoring and visit request handling.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100/50">
             <Users size={16} className="text-blue-600" />
             <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Team Sync Active</span>
          </div>
        </div>
      </div>

      {/* MAP SECTION */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
            <MapPin className="text-blue-600" size={24} />
            Territory Overview
        </h2>
        <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
           <TalukaMap onSelectTaluka={setSelectedTaluka} />
        </div>
      </div>

      {/* DETAILS GRID */}
      {selectedTaluka ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="text-blue-600" size={20} />
                    Taluka Details: {selectedTaluka}
                </h2>
            </div>
            <TalukaDetailsPanel taluka={selectedTaluka} />
          </div>

          <div className="space-y-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
                <Sparkles className="text-blue-600" size={20} />
                Smart Routing
            </h2>
            <SmartSuggestionPanel taluka={selectedTaluka} />
          </div>

        </div>
      ) : (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
              <MapPin size={32} />
          </div>
          <p className="text-slate-400 font-medium italic">
            Select a territory on the map to visualize visit requests.
          </p>
        </div>
      )}

      {/* TEAM STATUS */}
      <div className="space-y-6 pb-20">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
            <Activity className="text-blue-600" size={24} />
            Field Executive Live Status
        </h2>
        <TeamStatusTable />
      </div>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10 border-t border-slate-50">
          Bull Connect © 2026. Territory Logistics monitoring.
      </div>

    </div>
  )
}