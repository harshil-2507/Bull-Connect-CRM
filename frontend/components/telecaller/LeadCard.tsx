"use client"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, MapPin, Tag, ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LeadCard({ lead, onCall }: any) {
  const initials = lead.farmer_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="group bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Farmer Info */}
        <div className="flex items-center gap-5">
          <Avatar className="h-14 w-14 border-2 border-slate-50 shadow-sm group-hover:scale-105 transition-transform">
            <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {lead.farmer_name}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
              <Phone size={12} className="text-blue-400" />
              <span className="text-xs font-medium tracking-tight">{lead.phone_number}</span>
            </div>
          </div>
        </div>

        {/* Location & Tags */}
        <div className="flex flex-col gap-2 md:items-end">
           <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin size={12} className="text-slate-300" />
              <span className="text-[11px] font-bold uppercase tracking-widest">{lead.village}, {lead.taluka}</span>
           </div>
           {lead.latest_tag && (
             <div className="flex items-center gap-1.5 bg-blue-50/50 px-3 py-1 rounded-lg">
                <Tag size={10} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Tag: {lead.latest_tag}</span>
             </div>
           )}
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
          <StatusBadge status={lead.status} />
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-xl border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Info size={18} />
            </Button>
            <Button 
                onClick={() => onCall(lead)}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-lg shadow-blue-100 group-hover:px-6 transition-all"
            >
              Call Now
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}