"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  useWorkQueue, 
  useStats, 
  useCall 
} from "@/hooks/useTelecaller"
import StatsCards from "@/components/telecaller/StatsCards"
import WorkQueue from "@/components/telecaller/WorkQueue"
import CallDialog from "@/components/telecaller/CallDialog"
import { Sparkles, Calendar, Layers, Activity, Rocket } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function TelecallerPage() {
  const { loading } = useAuth()
  const { data: queue, isLoading: isQueueLoading } = useWorkQueue()
  const { data: stats } = useStats()
  const { mutate: callLead } = useCall()

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFC]">
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-[progress_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10 selection:bg-blue-100 selection:text-blue-700">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <Sparkles className="text-blue-600" size={32} />
             Work Queue
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
             Engage with your daily lead allocations and grow the harvest.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {["Today", "This Week", "Overview"].map((tab, i) => (
            <button 
              key={tab} 
              className={cn(
                "px-5 py-2 text-xs font-bold rounded-lg transition-all",
                i === 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <StatsCards stats={stats} />

      {/* Main List Section */}
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="text-blue-600" size={24} />
                My To-Do List
                <span className="ml-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                    {queue?.total || 0} LEADS
                </span>
            </h2>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600 rounded-xl">
                   <Layers size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600 rounded-xl">
                   <Activity size={18} />
                </Button>
            </div>
        </div>

        {isQueueLoading ? (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)}
            </div>
        ) : (
            <WorkQueue
              data={queue?.data}
              onCall={(lead: any) => {
                setSelectedLead(lead)
                setOpen(true)
              }}
            />
        )}
      </div>

      {/* Call Manager Dialog */}
      <CallDialog
        open={open}
        setOpen={setOpen}
        lead={selectedLead}
        onSubmit={(payload: any) => {
          callLead(payload)
        }}
      />

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10 border-t border-slate-50">
          Bull Connect © 2026. Data precision focused.
      </div>
    </div>
  )
}