"use client"

import { cn } from "@/lib/utils"

type StatusType = 
  | "RUNNING" 
  | "COMPLETED" 
  | "SCHEDULED" 
  | "QUALIFIED" 
  | "NEW_INQUIRY" 
  | "FOLLOW_UP" 
  | "OPTIMAL"

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

const statusStyles: Record<string, string> = {
  RUNNING: "bg-blue-50 text-blue-600 border-blue-100",
  COMPLETED: "bg-slate-100 text-slate-500 border-slate-200",
  SCHEDULED: "bg-yellow-50 text-yellow-600 border-yellow-100",
  QUALIFIED: "bg-blue-600 text-white border-blue-600",
  NEW_INQUIRY: "bg-indigo-50 text-indigo-600 border-indigo-100",
  FOLLOW_UP: "bg-orange-50 text-orange-600 border-orange-100",
  OPTIMAL: "bg-blue-50 text-blue-600 border-blue-100 font-bold",
  ACTIVE: "bg-blue-600 text-white border-blue-600",
  DRAFT: "bg-slate-50 text-slate-400 border-slate-100",
  PAUSED: "bg-orange-50 text-orange-600 border-orange-100",
  ASSIGNED: "bg-indigo-50 text-indigo-600 border-indigo-100",
  CONTACTED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  VISIT_REQUESTED: "bg-purple-50 text-purple-600 border-purple-100",
  VISIT_COMPLETED: "bg-blue-50 text-blue-600 border-blue-100",
  SOLD: "bg-emerald-600 text-white border-emerald-600",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null

  const normalizedStatus = status.toUpperCase().replace(/\s+/g, "_")
  const style = statusStyles[normalizedStatus] || "bg-slate-50 text-slate-400 border-slate-100"

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      style,
      className
    )}>
      {status.replace(/_/g, " ")}
    </span>
  )
}
