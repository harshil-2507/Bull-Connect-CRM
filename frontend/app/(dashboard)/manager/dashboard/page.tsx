"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line 
} from "recharts"
import { BarChart3, Users, Target, FileText, TrendingUp, Sparkles, Activity, Layers } from "lucide-react"
import { StatsCard } from "@/components/shared/StatsCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Campaign = {
  id: string
  name: string
  region: string
  status: string
  total_leads: number
}

const statusColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

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
    return (
      <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Skeleton className="h-96 rounded-3xl" />
           <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    )
  }

  const totalLeads = data?.reduce((acc: number, c: Campaign) => acc + Number(c.total_leads || 0), 0) || 0
  const activeCampaigns = data?.filter((c: Campaign) => c.status === "ACTIVE").length || 0
  const draftCampaigns = data?.filter((c: Campaign) => c.status === "DRAFT").length || 0
  const soldLeads = status?.find((s: any) => s.status === "SOLD")?.count || 0
  const conversionRate = totalLeads > 0 ? ((soldLeads / totalLeads) * 100).toFixed(1) : "0"

  const chartData = data?.map((c: Campaign) => ({ name: c.name, leads: Number(c.total_leads || 0) })).sort((a: any, b: any) => b.leads - a.leads)
  const funnelData = funnel?.map((f: any) => ({ stage: f.status, value: Number(f.count) }))
  const statusData = status?.map((s: any) => ({ name: s.status, value: Number(s.count) }))
  const trendData = trend?.map((t: any) => ({ day: t.day, leads: Number(t.leads) }))

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10 selection:bg-blue-100 selection:text-blue-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <Sparkles className="text-blue-600" size={32} />
             Manager Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Overview of regional campaigns and lead generation performance.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {["Overview", "Performance", "Reports"].map((tab, i) => (
            <button 
              key={tab} 
              className={cn(
                "px-5 py-2 text-xs font-bold rounded-lg transition-all",
                i === 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard title="Total Campaigns" value={data?.length || 0} icon={Target} />
        <StatsCard title="Total Leads" value={totalLeads.toLocaleString()} icon={Users} />
        <StatsCard title="Active Status" value={activeCampaigns} icon={BarChart3} />
        <StatsCard title="Draft Mode" value={draftCampaigns} icon={FileText}/>
        <StatsCard title="Conv. Rate" value={`${conversionRate}%`} delta={{ value: "Target: 5%", isPositive: true }} icon={TrendingUp} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Main Performance Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1 xl:col-span-2">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    Campaign Lead Performance
                </h2>
                <div className="flex gap-2">
                   <div className="h-2 w-2 rounded-full bg-blue-600" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Actual Leads Collected</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                    <defs>
                        <linearGradient id="managerBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="leads" fill="url(#managerBar)" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Funnel & Pie Charts */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                Lead Funnel
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 15, 15, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Lead Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} stroke="none">
                        {statusData?.map((_: any, index: number) => <Cell key={index} fill={statusColors[index % statusColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Trend Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1 xl:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Daily Lead Acquisition Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, stroke: '#2563eb', strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Performance Grid */}
      <div className="space-y-6 pb-10">
        <h2 className="text-2xl font-bold text-slate-900 px-2 tracking-tight">Active Campaign Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {data?.map((campaign: Campaign) => (
                <motion.div 
                    key={campaign.id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50/50 group"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{campaign.name}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{campaign.region || "Global Territory"}</span>
                        </div>
                        <StatusBadge status={campaign.status} />
                    </div>
                    
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Total Levest</span>
                            <span className="text-3xl font-black text-slate-800">{campaign.total_leads.toLocaleString()}</span>
                        </div>
                        <div className="h-10 w-24 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
                           <TrendingUp size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Sync</span>
                        <div className="flex -space-x-2">
                             {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100" />)}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  )
}