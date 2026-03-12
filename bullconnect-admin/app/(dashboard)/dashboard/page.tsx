"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardFunnel } from "@/components/dashboard/DashboardFunnel"
import { staggerContainer, fadeUp } from "@/lib/motion"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { PipelineAnalytics } from "@/components/dashboard/PipelineAnalytics"
import { TelecallerPerformanceTable } from "@/components/dashboard/TelecallerPerformanceTable"

const mockTrendData = [
    { value: 10 },
    { value: 15 },
    { value: 18 },
    { value: 22 },
    { value: 19 },
    { value: 25 },
]

const timeframes = ["7D", "30D", "90D", "1Y"]

export default function DashboardPage() {
    const { data, isLoading } = useDashboardSummary()
    const [activeTimeframe, setActiveTimeframe] = useState("30D")

    const cards = [
        {
            title: "Total Leads",
            value: data?.totalLeads,
            delta: 2.3,
            trend: mockTrendData,
        },
        {
            title: "Active Leads",
            value: data?.activeLeads,
            trend: mockTrendData,
        },
        {
            title: "Sold Leads",
            value: data?.soldLeads,
            trend: mockTrendData,
        },
        {
            title: "Conversion Rate",
            value: data?.conversionRate,
            type: "percentage" as const,
            delta: 2.3,
            trend: mockTrendData,
        },
        {
            title: "Visit Conversion",
            value: data?.visitConversionRate,
            type: "percentage" as const,
            delta: 5.8,
            trend: mockTrendData,
        },
        {
            title: "Total Revenue",
            value: data?.totalRevenue,
            type: "currency" as const,
        },
    ]

    return (
        <div
            className="
        relative min-h-screen px-8 py-10 overflow-hidden
        bg-gradient-to-b
        from-gray-50 via-white to-gray-100
        dark:from-slate-900 dark:via-slate-950 dark:to-black
      "
        >
            {/* Floating Background Particles */}
            <motion.div
                className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none"
                animate={{ y: [0, -30, 0] }}
                transition={{ duration: 12, repeat: Infinity }}
            />

            <motion.div
                className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"
                animate={{ y: [0, 40, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
            />

            <div className="relative space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">

                    <ThemeToggle />

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight relative inline-block text-gray-900 dark:text-white">
                            Admin Dashboard
                            <motion.span
                                layoutId="underline"
                                className="absolute left-0 -bottom-1 h-[3px] bg-blue-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                        </h1>

                        <p className="text-sm mt-2 text-gray-500 dark:text-slate-400">
                            Performance overview & conversion analytics
                        </p>
                    </div>

                    {/* Timeframe Selector */}
                    <div
                        className="
              flex gap-2 p-1 rounded-xl shadow-sm
              bg-white dark:bg-slate-900
              border border-gray-200 dark:border-slate-800
            "
                    >
                        {timeframes.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setActiveTimeframe(tf)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${activeTimeframe === tf
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Section */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="
              p-6 rounded-2xl backdrop-blur shadow-sm
              bg-white/70 dark:bg-slate-900/70
              border border-gray-200 dark:border-slate-800
            "
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                            {cards.map((card, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeUp}
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <KpiCard {...card} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Divider */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent"
                />
                <div className="xl:col-span-2">
                    <PipelineAnalytics />
                </div>

                <div className="mt-12">
                    <TelecallerPerformanceTable />
                </div>



                {/* Funnel + hard coded Insights to align cards design */}


                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    <div className="xl:col-span-2">
                        <DashboardFunnel />
                    </div>

                    {/* Insights Card */}
                    <motion.div
  initial={{ opacity: 0, x: 40 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6 }}
  className="
    p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300
    bg-white dark:bg-slate-900
    border border-gray-200 dark:border-slate-800
  "
>
  <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
    Performance Insights
  </h2>

  {data && (
    <div className="space-y-6 text-sm text-gray-500 dark:text-slate-400">

      {/* Lead → Visit Conversion */}
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          Lead → Visit Conversion
        </p>
        <p>
          {((data.visitCompleted / data.totalLeads) * 100).toFixed(1)}% of leads
          progressed to farm visits.
        </p>
      </div>

      {/* Visit → Deal Conversion */}
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          Visit → Deal Conversion
        </p>
        <p>
          {((data.soldLeads / data.visitCompleted) * 100).toFixed(1)}% of visits
          converted into closed deals.
        </p>
      </div>

      {/* Average Deal Value */}
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          Average Deal Value
        </p>
        <p>
          ₹{Math.round(data.totalRevenue / Math.max(data.soldLeads, 1)).toLocaleString()} per sale on average.
        </p>
      </div>

    </div>
  )}
</motion.div>

                </div>

            </div>
        </div>
    )
}