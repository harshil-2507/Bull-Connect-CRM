"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteLeads } from "@/hooks/useInfiniteLeads"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/shared/StatsCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  Calendar,
  Layers,
  Zap,
  Timer,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import LeadRowMenu from "@/components/leads/LeadRowMenu"
import { cn } from "@/lib/utils"

export default function LeadsPage() {
  const router = useRouter()
  const { data: summaryData, isLoading: isSummaryLoading } = useDashboardSummary()
  const [search, setSearch] = useState("")

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteLeads()

  const observer = useRef<IntersectionObserver | null>(null)
  const lastRowRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      const first = entries[0]
      if (first?.isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    })
    if (node) observer.current.observe(node)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const leads = data?.pages?.flatMap((p: any) => p?.leads || []) ?? []

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  }

  const avatarColors = ["bg-blue-100 text-blue-600", "bg-orange-100 text-orange-600", "bg-green-100 text-green-600", "bg-purple-100 text-purple-600"]

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Farmer Leads</h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Manage and distribute {summaryData?.totalLeads?.toLocaleString() || "1,240"} active agricultural leads
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white gap-2 text-slate-600 font-bold px-5">
            <Download size={18} />
            Export CSV
          </Button>
          <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-6 shadow-lg shadow-blue-100">
            <Filter size={18} />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isSummaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <StatsCard 
              title="Total Leads" 
              value={summaryData?.totalLeads?.toLocaleString() || "12,408"}
              delta={{ value: "+12%", isPositive: true }}
            />
            <StatsCard 
              title="Conversion Rate" 
              value={`${(summaryData?.conversionRate || 4.2).toFixed(1)}%`}
              delta={{ value: "Optimal", isPositive: true }}
            />
            <StatsCard 
              title="Assigned Today" 
              value="452"
              icon={Zap}
            />
            <StatsCard 
              title="Avg. Response Time" 
              value="1.4h"
              delta={{ value: "-5m", isPositive: true }}
              icon={Timer}
            />
          </>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search farmer database..."
            className="w-full bg-slate-50 border-none rounded-xl h-12 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="h-8 w-px bg-slate-100" />

        <div className="flex gap-2 pr-2">
          {["All Statuses", "All Campaigns", "Oct 1, 2023 - Oct 31, 2023"].map((filter, i) => (
            <Button key={i} variant="outline" className="h-12 border-slate-100 bg-slate-50/50 rounded-xl px-4 gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider">
              {i === 2 && <Calendar size={14} className="text-blue-500" />}
              {filter}
              <ChevronDown size={14} className="text-slate-400" />
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
            <Layers size={18} />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Farmer Name</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Contact Information</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-0">Status</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Campaign</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Assigned Telecaller</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="py-6 px-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : (
              leads.map((lead: any, i: number) => (
                <TableRow 
                  key={lead.id} 
                  ref={i === leads.length - 1 ? lastRowRef : null}
                  className="hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                >
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <Avatar className={cn("h-10 w-10 border-2 border-white shadow-sm", avatarColors[i % avatarColors.length])}>
                        <AvatarFallback className="font-bold text-xs">{getInitials(lead.farmer_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{lead.farmer_name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{lead.village || "Unknown Village"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{lead.phone_number}</span>
                      <span className="text-[11px] font-medium text-green-500">Verified Mobile</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-0">
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{lead.campaign_name || "General"}</span>
                      <span className="text-[10px] font-bold text-slate-300">2024 Cycle</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    {lead.assigned_to_name ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-slate-100 text-slate-400 text-[8px] font-bold">{getInitials(lead.assigned_to_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-600">{lead.assigned_to_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium italic text-slate-300">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <LeadRowMenu leadId={lead.id} phone={lead.phone_number} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <p className="text-sm text-slate-400 font-medium italic">
            Showing 1-10 of {summaryData?.totalLeads?.toLocaleString() || "1,240"} leads
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-slate-200 font-bold text-slate-300 hover:text-blue-600">
              {"<"}
            </Button>
            <div className="flex gap-1.5">
              {[1, 2, 3, "...", 124].map((p, i) => (
                <Button 
                    key={i} 
                    variant={p === 1 ? "default" : "outline"}
                    className={cn(
                        "w-9 h-9 rounded-xl p-0 text-xs font-bold transition-all",
                        p === 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110" : "border-slate-100 text-slate-400 bg-white hover:bg-slate-50"
                    )}
                >
                    {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-slate-200 font-bold text-slate-300 hover:text-blue-600">
              {">"}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      <div className="fixed bottom-10 right-10 flex items-center gap-4 bg-white p-4 pr-6 rounded-2xl shadow-2xl border border-blue-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <div className="h-10 w-1 bg-blue-600 rounded-full" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Real-time Update</span>
          <span className="text-sm font-bold text-slate-900">3 New Leads from Irrigation Drive</span>
        </div>
        <div className="ml-4 h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Plus size={14} className="rotate-45" />
        </div>
      </div>
    </div>
  )
}