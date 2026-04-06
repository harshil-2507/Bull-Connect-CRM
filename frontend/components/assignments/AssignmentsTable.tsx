"use client"

import { useAssignments } from "@/hooks/useAssignments"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Clock, UserCheck } from "lucide-react"

export default function AssignmentsTable() {
  const { data, isLoading } = useAssignments()
  const assignments = data || []

  function getInitials(name: string) {
    return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-100/50">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Prospect Details</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Assigned Strategy</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Allocation Time</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={4} className="py-6 px-8"><Skeleton className="h-12 w-full rounded-2xl" /></TableCell>
              </TableRow>
            ))
          ) : assignments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">No lead assignments recorded.</TableCell>
            </TableRow>
          ) : (
            assignments.map((a: any) => (
              <TableRow key={a.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-[10px]">{getInitials(a.lead_name || a.farmer_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{a.lead_name || a.farmer_name || "Anonymous Prospect"}</span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={10} className="text-blue-400" />
                        <span className="text-[11px] font-medium">{a.lead_phone || a.phone_number || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <UserCheck size={14} className="text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700">{a.telecaller_name || "Awaiting Telecaller"}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Expert</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-sm font-bold">
                            {a.assigned_at ? new Date(a.assigned_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                   <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all">
                      View Flow
                   </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}