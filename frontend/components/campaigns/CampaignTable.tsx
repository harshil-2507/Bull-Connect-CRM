"use client"

import { useCampaigns } from "@/hooks/useCampaigns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CampaignStatusBadge from "./CampaignStatusBadge"
import UploadLeadsDialog from "./UploadLeadsDialog"
import { MoreVertical, Rocket, Target, Megaphone, TrendingUp } from "lucide-react"

export default function CampaignTable() {
  const { data, isLoading } = useCampaigns()

  if (isLoading) return (
     <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-12 text-center text-slate-400 font-medium">
        Loading campaigns datastream...
     </div>
  )

  const getIcon = (i: number) => {
    const icons = [
        <Rocket size={18} key="rocket" />,
        <Target size={18} key="target" />,
        <Megaphone size={18} key="megaphone" />,
        <TrendingUp size={18} key="trending" />
    ]
    return icons[i % icons.length]
  }

  const bgColors = [
    "bg-blue-50 text-blue-600",
    "bg-orange-50 text-orange-600",
    "bg-blue-50 text-blue-600",
    "bg-green-50 text-green-600"
  ]

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Campaign Name</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Status</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Timeline</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-center">Total Leads</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center text-slate-400 italic">No campaigns active at this time.</TableCell>
            </TableRow>
          ) : (
            data?.map((campaign: any, i: number) => (
              <TableRow key={campaign.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${bgColors[i % bgColors.length]}`}>
                        {getIcon(i)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{campaign.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 italic">Seasonal Strategy</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8">
                  <CampaignStatusBadge status={campaign.status} />
                </TableCell>
                <TableCell className="py-6 px-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{campaign.start_date?.slice(0, 10)}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Until {campaign.end_date?.slice(0, 10)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-8 text-center">
                  <span className="text-sm font-bold text-slate-600">{campaign.total_leads?.toLocaleString() || 0}</span>
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <UploadLeadsDialog campaignId={campaign.id} />
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}