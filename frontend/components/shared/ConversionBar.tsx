"use client"

import { cn } from "@/lib/utils"

interface ConversionBarProps {
  percentage: number
  showValue?: boolean
  className?: string
}

export function ConversionBar({ percentage, showValue = true, className }: ConversionBarProps) {
  const isPositive = percentage > 0.5 // Threshold for green-vs-blue/gray
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showValue && (
        <span className="text-[13px] font-bold text-slate-700 min-w-[40px]">
          {percentage.toFixed(1)}%
        </span>
      )}
      <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-700",
            percentage > 5 ? "bg-green-500" : "bg-blue-600"
          )}
          style={{ width: `${Math.min(percentage * 10, 100)}%` }} // Scaled for visual representation if needed, or straight percentage
        />
      </div>
      <div className="h-1.5 w-8 bg-slate-50 rounded-full" /> {/* Visual spacer/end gap as seen in image */}
    </div>
  )
}
