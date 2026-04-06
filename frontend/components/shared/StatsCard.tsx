"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { ResponsiveContainer, LineChart, Line } from "recharts"

interface StatsCardProps {
  title: string
  value: string | number
  subValue?: string
  icon?: LucideIcon
  delta?: {
    value: string | number
    isPositive: boolean
    label?: string
  }
  trendData?: { value: number }[]
  progress?: {
    current: number
    total: number
    label?: string
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  subValue,
  icon: Icon,
  delta,
  trendData,
  progress,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("p-6 bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl relative overflow-hidden", className)}>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {value}
            </h3>
            {delta && (
              <span className={cn(
                "text-[12px] font-bold flex items-center gap-0.5",
                delta.isPositive ? "text-green-500" : "text-red-500"
              )}>
                {delta.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta.value}
                {delta.label && <span className="text-slate-400 font-medium ml-1">{delta.label}</span>}
              </span>
            )}
          </div>
          {subValue && (
            <p className="text-xs text-slate-400 mt-1 font-medium italic">
              {subValue}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Icon size={20} />
          </div>
        )}
      </div>

      {trendData && (
        <div className="h-10 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {progress && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400">
            <span>Progress</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {progress.label && (
            <p className="text-[10px] text-slate-400 text-right font-medium">
              / {progress.label}
            </p>
          )}
        </div>
      )}

      {/* Decorative gradient overlay as seen in images */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/0 to-blue-50/50 pointer-events-none rounded-full translate-x-16 -translate-y-16" />
    </Card>
  )
}
