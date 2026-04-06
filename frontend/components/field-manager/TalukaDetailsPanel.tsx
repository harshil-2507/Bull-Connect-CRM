"use client"

import { useTalukaDetails } from "@/hooks/useTalukaDetails"
import { useSmartAssign } from "@/hooks/useSmartAssign"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles, Users, Layers, Zap, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

export function TalukaDetailsPanel({ taluka }: { taluka: string }) {

  const { data, isLoading } = useTalukaDetails(taluka)
  const smartAssign = useSmartAssign()

  if (isLoading) return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
     </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Smart Assign Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Resource Allocation</h3>
              <p className="text-slate-400 text-sm font-medium italic">Automatically distribute {data.requests?.length || 0} pending visit requests across field experts.</p>
          </div>
          <Button
            onClick={() => smartAssign.mutate(taluka)}
            className="relative z-10 h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-3 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            <Sparkles size={18} />
            Auto Assign Smart
          </Button>
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/30 rounded-full translate-x-12 -translate-y-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        
        {/* REQUESTS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100/50">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                Visit Requests
            </h3>

            <div className="space-y-4">
                {data.requests?.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{r.farmer_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Pending Visit Route</span>
                        </div>
                        <StatusBadge status={r.priority} />
                    </div>
                ))}
            </div>
        </div>

        {/* EXECUTIVES */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100/50">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                Operational Capacity
            </h3>

            <div className="space-y-4">
                {data.fieldExecutives?.map((e: any) => (
                    <div key={e.id} className="p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                                    <AvatarFallback className="text-[8px] font-bold">{e.name?.split(" ").map((n:string)=>n[0]).join("").toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-slate-900 uppercase tracking-tight">{e.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.current_load}/{e.capacity} Loaded</span>
                        </div>
                        <Progress value={(e.current_load / e.capacity) * 100} className="h-1 bg-slate-100" />
                    </div>
                ))}
            </div>
        </div>

      </div>

    </div>
  )
}