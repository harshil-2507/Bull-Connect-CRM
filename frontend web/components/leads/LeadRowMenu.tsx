"use client"

import { Phone, Edit, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

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

        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={18} />
        </Button>

      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            window.open(`tel:${phone}`)
          }}
        >
          <Phone size={16} className="mr-2" />
          Call
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/leads/${leadId}`)
          }}
        >
          <Eye size={16} className="mr-2" />
          View
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/leads/${leadId}/edit`)
          }}
        >
          <Edit size={16} className="mr-2" />
          Edit
        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>
  )
}