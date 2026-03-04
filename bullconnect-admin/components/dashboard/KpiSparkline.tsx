"use client"

import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

export function KpiSparkline({
  data,
}: {
  data: { value: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          style={{
            filter: "drop-shadow(0px 0px 4px rgba(59,130,246,0.3))",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}