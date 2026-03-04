"use client"

import { Card, CardContent } from "@/components/ui/card"
import CountUp from "react-countup"
import { KpiSparkline } from "./KpiSparkline"
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from "@/lib/format"
import { motion } from "framer-motion"

interface KpiCardProps {
  title: string
  value?: number
  loading?: boolean
  type?: "number" | "currency" | "percentage"
  delta?: number
  trend?: { value: number }[]
}

export function KpiCard({
  title,
  value,
  type = "number",
  delta,
  trend,
}: KpiCardProps) {

  function renderValue() {
    if (value === undefined) return "—"

    return (
      <CountUp
        end={value}
        duration={1.2}
        separator=","
        formattingFn={(val) => {
          if (type === "currency") return formatCurrency(val)
          if (type === "percentage") return formatPercentage(val)
          return formatNumber(val)
        }}
      />
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{title}</p>

          <p className="text-2xl font-semibold mt-2">
            {renderValue()}
          </p>

          {delta !== undefined && (
            <p
              className={`text-sm mt-2 ${
                delta >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
            </p>
          )}

          {trend && (
            <div className="mt-4">
              <KpiSparkline data={trend} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}