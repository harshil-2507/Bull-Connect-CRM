"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { motion } from "framer-motion"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

import {
  BarChart3,
  Users,
  Target,
  FileText,
  TrendingUp
} from "lucide-react"

type Campaign = {
  id: string
  name: string
  region: string
  status: string
  total_leads: number
}

const campaignColors = [
  "from-indigo-50 to-indigo-100",
  "from-purple-50 to-purple-100",
  "from-emerald-50 to-emerald-100",
  "from-cyan-50 to-cyan-100",
  "from-pink-50 to-pink-100",
  "from-amber-50 to-amber-100",
]

const statusColors = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4"
]

export default function ManagerDashboardPage() {

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await api.get("/campaigns")
      return res.data.data
    }
  })

  const { data: funnel } = useQuery({
    queryKey: ["lead-funnel"],
    queryFn: async () => {
      const res = await api.get("/analytics/lead-funnel")
      return res.data.data
    }
  })

  const { data: status } = useQuery({
    queryKey: ["lead-status"],
    queryFn: async () => {
      const res = await api.get("/analytics/lead-status")
      return res.data.data
    }
  })

  const { data: trend } = useQuery({
    queryKey: ["lead-trend"],
    queryFn: async () => {
      const res = await api.get("/analytics/lead-trend")
      return res.data.data
    }
  })

  if (isLoading) {
    return <div className="p-10 text-slate-600">Loading dashboard...</div>
  }

  const totalCampaigns = data?.length || 0

  const totalLeads = data?.reduce(
    (acc: number, c: Campaign) => acc + Number(c.total_leads || 0),
    0
  )

  const activeCampaigns =
    data?.filter((c: Campaign) => c.status === "ACTIVE").length

  const draftCampaigns =
    data?.filter((c: Campaign) => c.status === "DRAFT").length

  const soldLeads =
    status?.find((s: any) => s.status === "SOLD")?.count || 0

  const conversionRate =
    totalLeads > 0
      ? ((soldLeads / totalLeads) * 100).toFixed(1)
      : "0"

  const chartData = data
    ?.map((c: Campaign) => ({
      name: c.name,
      leads: Number(c.total_leads || 0)
    }))
    .sort((a: any, b: any) => b.leads - a.leads)

  const funnelData = funnel?.map((f: any) => ({
    stage: f.status,
    value: Number(f.count)
  }))

  const statusData = status?.map((s: any) => ({
    name: s.status,
    value: Number(s.count)
  }))

  const trendData = trend?.map((t: any) => ({
    day: t.day,
    leads: Number(t.leads)
  }))

  return (

    <div className="relative space-y-10 text-slate-800">

      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[140px]" />
      </div>

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Manager Dashboard
        </h1>

        <p className="text-slate-500 mt-1">
          Overview of campaigns and lead generation
        </p>
      </div>

      {/* KPI */}

      <div className="grid grid-cols-5 gap-6">

        <KpiCard title="Total Campaigns" value={totalCampaigns} color="indigo" icon={<Target size={20} />} />

        <KpiCard title="Total Leads" value={totalLeads} color="blue" icon={<Users size={20} />} />

        <KpiCard title="Active Campaigns" value={activeCampaigns} color="emerald" icon={<BarChart3 size={20} />} />

        <KpiCard title="Draft Campaigns" value={draftCampaigns} color="amber" icon={<FileText size={20} />} />

        <KpiCard title="Conversion Rate" value={`${conversionRate}%`} color="rose" icon={<TrendingUp size={20} />} />

      </div>

      {/* BAR CHART */}

      <div className="rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Campaign Lead Performance
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={chartData}>

            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="leads" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />

          </BarChart>

        </ResponsiveContainer>

      </div>

      {/* FUNNEL + PIE */}

      <div className="grid grid-cols-2 gap-6">

        {/* FUNNEL */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            Lead Funnel
          </h2>

          <ResponsiveContainer width="100%" height={260}>

            <BarChart data={funnelData} layout="vertical">

              <XAxis type="number" />

              <YAxis dataKey="stage" type="category" width={150} />

              <Tooltip />

              <Bar dataKey="value" fill="#6366F1" radius={[10, 10, 10, 10]} />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* PIE */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            Lead Status Distribution
          </h2>

          <ResponsiveContainer width="100%" height={260}>

            <PieChart>

              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={95}
                label={({ percent }: { percent?: number }) =>
                  percent ? `${(percent * 100).toFixed(0)}%` : ""
                }
              >

                {statusData?.map((entry: any, index: number) => (
                  <Cell key={index} fill={statusColors[index % statusColors.length]} />
                ))}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* TREND */}

      <div className="rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Daily Lead Acquisition Trend
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={trendData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="leads"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* CAMPAIGNS */}

      <div>

        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Campaign Performance
        </h2>

        <div className="grid grid-cols-3 gap-6">

          {data?.map((campaign: Campaign, i: number) => {

            const gradient = campaignColors[i % campaignColors.length]

            return (

              <motion.div
                key={campaign.id}
                whileHover={{ y: -6, scale: 1.03 }}
                className={`rounded-xl border shadow-sm p-6 bg-gradient-to-br ${gradient}`}
              >

                <div className="flex justify-between items-start">

                  <h3 className="font-semibold text-lg text-slate-900">
                    {campaign.name}
                  </h3>

                  <StatusBadge status={campaign.status} />

                </div>

                <div className="mt-5 text-sm space-y-2">

                  <p>
                    Region:
                    <span className="ml-2 text-slate-500">
                      {campaign.region || "N/A"}
                    </span>
                  </p>

                  <p className="font-semibold text-indigo-600">
                    Leads: {campaign.total_leads}
                  </p>

                </div>

              </motion.div>

            )

          })}

        </div>

      </div>

    </div>

  )
}

/* KPI CARD */

function KpiCard({ title, value, color, icon }: any) {

  const styles: any = {

    indigo: { bg: "from-indigo-50 to-indigo-100", border: "border-indigo-500", text: "text-indigo-600" },

    blue: { bg: "from-blue-50 to-blue-100", border: "border-blue-500", text: "text-blue-600" },

    emerald: { bg: "from-emerald-50 to-emerald-100", border: "border-emerald-500", text: "text-emerald-600" },

    amber: { bg: "from-amber-50 to-amber-100", border: "border-amber-500", text: "text-amber-600" },

    rose: { bg: "from-rose-50 to-pink-100", border: "border-rose-500", text: "text-rose-600" }

  }

  const s = styles[color]

  return (

    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className={`rounded-xl p-5 border border-t-4 ${s.border} bg-gradient-to-br ${s.bg} shadow-sm`}
    >

      <div className="flex justify-between items-center">

        <p className="text-sm text-slate-500">{title}</p>

        <div className={s.text}>{icon}</div>

      </div>

      <p className={`text-3xl font-bold mt-2 ${s.text}`}>
        {value}
      </p>

    </motion.div>

  )

}

/* STATUS BADGE */

function StatusBadge({ status }: any) {

  const styles: any = {
    ACTIVE: "bg-green-100 text-green-700",
    DRAFT: "bg-gray-200 text-gray-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-blue-100 text-blue-700"
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] || "bg-gray-100"}`}>
      {status}
    </span>
  )

}