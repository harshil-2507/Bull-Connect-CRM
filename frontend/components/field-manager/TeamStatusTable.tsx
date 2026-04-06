"use client"

import { useTeamStatus } from "@/hooks/useTeamStatus"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Monitor, MapPin, CheckCircle } from "lucide-react"

export function TeamStatusTable() {
  const { data, isLoading } = useTeamStatus()

  if (isLoading) return (
     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-400 font-medium">
        Syncing live field data...
     </div>
  )

  function getInitials(name: string) {
    return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-100/50">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Field Executive</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Visits Logged</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Active Assignments</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-right">Completion Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">No field data retrieved.</TableCell>
            </TableRow>
          ) : (
            data?.map((t: any, i: number) => {
              const completion = t.total_visits > 0 ? (t.completed_visits / t.total_visits) * 100 : 0
              return (
                <TableRow key={i} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-[10px]">{getInitials(t.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{t.name}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin size={10} className="text-blue-400" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">Field Agent Status</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">{t.total_visits} Complete</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">{t.in_progress} In Progress</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <div className="flex flex-col items-end gap-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <Monitor size={12} className="text-slate-300" />
                           Daily Target Activity
                       </div>
                       <div className="w-24 group">
                          <Progress value={completion || (t.total_visits > 0 ? 100 : 0)} className="h-1.5 bg-slate-100" />
                       </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}