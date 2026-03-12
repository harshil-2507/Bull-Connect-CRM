"use client"

import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"

export function DashboardFunnel() {
  const { theme } = useTheme()
  const { data } = useDashboardSummary()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  const COLORS = isDark
    ? ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
    : ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"]

  /**
   * REAL DATA FROM DATABASE
   */

const funnelData = [
  {
    name: "Leads",
    value: data?.totalLeads || 0,
  },
  {
    name: "Visit Requested",
    value: data?.visitRequested || 0,
  },
  {
    name: "Visit Completed",
    value: data?.visitCompleted || 0,
  },
  {
    name: "Sold",
    value: data?.soldLeads || 0,
  },
]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="
        relative overflow-hidden rounded-2xl p-8
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
        shadow-sm hover:shadow-xl
        transition-all duration-300
      "
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-lg font-semibold tracking-tight mb-6 text-gray-900 dark:text-white">
        Conversion Funnel
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: isDark
                  ? "1px solid #334155"
                  : "1px solid #e5e7eb",
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                color: isDark ? "#ffffff" : "#111827",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            />

            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
              animationDuration={1000}
            >
              <LabelList
                position="right"
                fill={isDark ? "#ffffff" : "#111827"}
                stroke="none"
                dataKey="name"
              />

              {funnelData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}