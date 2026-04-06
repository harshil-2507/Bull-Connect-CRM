"use client"

import { useState } from "react"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/shared/StatsCard"
import { 
  Users, 
  Target, 
  CircleDollarSign, 
  Activity,
  PhoneCall,
  LayoutDashboard
} from "lucide-react"
import { PipelineAnalytics } from "@/components/dashboard/PipelineAnalytics"
import { TelecallerPerformanceTable } from "@/components/dashboard/TelecallerPerformanceTable"
import { DashboardFunnel } from "@/components/dashboard/DashboardFunnel"
import { cn } from "@/lib/utils"

const mockTrend = [
  { value: 10 }, { value: 15 }, { value: 12 }, { value: 18 }, { value: 16 }, { value: 20 }
]

export default function DashboardPage() {
    const { data, isLoading } = useDashboardSummary()
    const [activeTimeframe, setActiveTimeframe] = useState("30D")

    return (
        <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10">
            
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Performance overview & conversion analytics.
                    </p>
                </div>

                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    {["7D", "30D", "90D", "1Y"].map((tf) => (
                        <button 
                            key={tf}
                            onClick={() => setActiveTimeframe(tf)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                tf === activeTimeframe ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-slate-600"
                            )}
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
                        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                    <StatsCard 
                        title="Total Leads"
                        value={data?.totalLeads || 0}
                        delta={{ value: "+2.3%", isPositive: true }}
                        trendData={mockTrend}
                    />
                    <StatsCard 
                        title="Active Leads"
                        value={data?.activeLeads || 0}
                        icon={Users}
                    />
                    <StatsCard 
                        title="Sold Leads"
                        value={data?.soldLeads || 0}
                        icon={Target}
                    />
                    <StatsCard 
                        title="Conversion Rate"
                        value={`${(data?.conversionRate || 0).toFixed(1)}%`}
                        delta={{ value: "+2.3%", isPositive: true }}
                    />
                    <StatsCard 
                        title="Visit Conversion"
                        value={`${(data?.visitConversionRate || 0).toFixed(1)}%`}
                        delta={{ value: "+5.8%", isPositive: true }}
                    />
                    <StatsCard 
                        title="Total Revenue"
                        value={`₹${(data?.totalRevenue || 0).toLocaleString()}`}
                        icon={CircleDollarSign}
                    />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Charts Section */}
                <div className="xl:col-span-2 space-y-8">
                    
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                         <Activity className="text-blue-600" size={20} />
                         Pipeline Analytics
                       </h2>
                       <PipelineAnalytics />
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                         <PhoneCall className="text-blue-600" size={20} />
                         Telecaller Performance
                       </h2>
                       <TelecallerPerformanceTable />
                    </div>

                </div>

                {/* Right Column: Funnel & Insights */}
                <div className="space-y-8">
                    
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                         <LayoutDashboard className="text-blue-600" size={20} />
                         Lead Funnel
                       </h2>
                       <DashboardFunnel />
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="relative z-10">
                          <h2 className="text-xl font-bold text-slate-900 mb-6">Performance Insights</h2>
                          {data && (
                            <div className="space-y-6">
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Lead → Visit</p>
                                  <p className="font-bold text-slate-900">{((data.visitCompleted / data.totalLeads) * 100).toFixed(1)}% Conversion</p>
                                  <p className="text-xs text-slate-500 mt-1">Leads progressed to farm visits.</p>
                               </div>
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Visit → Deal</p>
                                  <p className="font-bold text-slate-900">{((data.soldLeads / data.visitCompleted) * 100).toFixed(1)}% Conversion</p>
                                  <p className="text-xs text-slate-500 mt-1">Visits converted into closed deals.</p>
                               </div>
                               <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Average Deal Value</p>
                                  <p className="text-2xl font-bold">₹{Math.round(data.totalRevenue / Math.max(data.soldLeads, 1)).toLocaleString()}</p>
                                  <p className="text-[10px] font-medium text-blue-100/60 mt-1">Net average per sale</p>
                               </div>
                            </div>
                          )}
                       </div>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full translate-x-16 -translate-y-16" />
                    </div>

                </div>

            </div>

            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10">
                Bull Connect © 2026. All performance data processed with precision.
            </div>
        </div>
    )
}