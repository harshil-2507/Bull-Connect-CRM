"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
import { usePipelineAnalytics } from "@/hooks/usePipelineAnalytics"

interface Props {
  from?: string
  to?: string
}

const COLORS = [
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#1d4ed8",
]

export function PipelineAnalytics({ from, to }: Props) {
  const { data, isLoading, isError } = usePipelineAnalytics(from, to)

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Loading pipeline analytics...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm text-red-500">
          Failed to load pipeline analytics.
        </p>
      </div>
    )
  }

  const chartData = data || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        p-8 rounded-2xl shadow-sm
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
      "
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Pipeline Distribution
      </h2>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="status"
              stroke="#94a3b8"
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="
              p-4 rounded-xl
              bg-gray-50 dark:bg-slate-800
              border border-gray-200 dark:border-slate-700
            "
          >
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {item.status.replaceAll("_", " ")}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.count}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}