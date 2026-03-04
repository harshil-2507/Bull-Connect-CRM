"use client"

import { motion } from "framer-motion"
import { useTelecallerPerformance } from "@/hooks/useTelecallerPerformance"

interface Props {
  from?: string
  to?: string
}

export function TelecallerPerformanceTable({ from, to }: Props) {
  const { data, isLoading, isError } =
    useTelecallerPerformance(from, to)

  const telecallers = (data ?? []).map((user) => {
    const assigned = Number(user.assigned ?? 0)
    const contacted = Number(user.contacted ?? 0)
    const visitRequested = Number(user.visitRequested ?? 0)
    const visitCompleted = Number(user.visitCompleted ?? 0)
    const closed = Number(user.closed ?? 0)

    const conversion =
      assigned > 0 ? (closed / assigned) * 100 : 0

    return {
      ...user,
      assigned,
      contacted,
      visitRequested,
      visitCompleted,
      closed,
      conversion,
    }
  })

  // Auto sort by conversion descending
  telecallers.sort((a, b) => b.conversion - a.conversion)

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
        Loading telecaller performance...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm text-red-500">
        Failed to load telecaller performance.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="
        p-8 rounded-2xl shadow-sm
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
      "
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Telecaller Performance
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400">
              <th className="py-3 text-left">Name</th>
              <th className="text-left">Assigned</th>
              <th className="text-left">Contacted</th>
              <th className="text-left">Visit Requested</th>
              <th className="text-left">Visit Completed</th>
              <th className="text-left">Closed</th>
              <th className="text-left">Conversion %</th>
            </tr>
          </thead>

          <tbody>
            {telecallers.map((user, index) => (
              <tr
                key={user.telecallerId}
                className={`
                  border-b border-gray-100 dark:border-slate-800
                  hover:bg-gray-50 dark:hover:bg-slate-800/50
                  transition
                  ${index === 0 ? "bg-green-50 dark:bg-green-900/10" : ""}
                `}
              >
                <td className="py-4 font-medium text-gray-900 dark:text-white">
                  {user.name}
                  {index === 0 && (
                    <span className="ml-2 text-xs text-green-600 font-semibold">
                      Top Performer
                    </span>
                  )}
                </td>

                <td>{user.assigned}</td>
                <td>{user.contacted}</td>
                <td>{user.visitRequested}</td>
                <td>{user.visitCompleted}</td>
                <td>{user.closed}</td>

                <td
                  className={`font-semibold ${
                    user.conversion >= 50
                      ? "text-green-600"
                      : user.conversion === 0
                      ? "text-red-500"
                      : "text-yellow-600"
                  }`}
                >
                  {user.conversion.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}