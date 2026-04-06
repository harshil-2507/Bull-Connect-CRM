"use client"

import { Phone, Edit3, Eye, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export default function LeadRowMenu({
  leadId,
  phone
}: {
  leadId: string
  phone: string
}) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="text-slate-300 hover:text-slate-600 transition-colors p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={20} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-56 mt-2 rounded-2xl shadow-xl border border-slate-100 bg-white z-[100]"
      >
        <DropdownMenuItem
          className="gap-3 py-3 rounded-xl cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            window.open(`tel:${phone}`)
          }}
        >
          <Phone size={16} className="text-slate-400" />
          <span className="font-medium text-slate-700">Call Farmer</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-3 py-3 rounded-xl cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/admin/leads/${leadId}`)
          }}
        >
          <Eye size={16} className="text-slate-400" />
          <span className="font-medium text-slate-700">View Details</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-3 py-3 rounded-xl cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/admin/leads/${leadId}/edit`)
          }}
        >
          <Edit3 size={16} className="text-slate-400" />
          <span className="font-medium text-slate-700">Edit Lead</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}