"use client"

import { Lead } from "@/types/leads"
import { useRouter } from "next/navigation"

import StatusBadge from "./StatusBadge"
import LeadRowMenu from "./LeadRowMenu"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

import {
  User,
  Phone,
  MapPin,
  Clock
} from "lucide-react"

type Props = {
  leads: Lead[]
  toggleSort: (field: string) => void
  lastRowRef?: (node: HTMLTableRowElement | null) => void
}

export default function LeadsTable({
  leads,
  toggleSort,
  lastRowRef
}: Props) {

  const router = useRouter()

  return (

    <div className="border rounded-xl bg-card shadow-sm overflow-hidden h-[70vh] flex flex-col">

      <div className="overflow-y-auto flex-1">

        <Table>

          {/* Sticky Header */}

          <TableHeader className="bg-muted sticky top-0 z-10">

            <TableRow>

              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("farmer_name")}
              >
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Farmer ↑↓
                </div>
              </TableHead>

              <TableHead>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  Phone
                </div>
              </TableHead>

              <TableHead>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  Village
                </div>
              </TableHead>

              <TableHead>Status</TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("created_at")}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Created ↑↓
                </div>
              </TableHead>

              <TableHead className="w-[80px] text-center">
                Actions
              </TableHead>

            </TableRow>

          </TableHeader>

          <TableBody>

            {leads.map((lead, index) => {

              const isLast = index === leads.length - 1

              return (

                <TableRow
                  key={lead.id}
                  ref={isLast ? lastRowRef : null}
                  className="hover:bg-muted/50 transition cursor-pointer"
                >

                  <TableCell
                    className="font-medium"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    {lead.farmer_name}
                  </TableCell>

                  <TableCell>
                    {lead.phone_number}
                  </TableCell>

                  <TableCell>
                    {lead.village ?? "-"}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>

                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-center">

                    <LeadRowMenu
                      leadId={lead.id}
                      phone={lead.phone_number}
                    />

                  </TableCell>

                </TableRow>

              )

            })}

          </TableBody>

        </Table>

      </div>

    </div>
  )
}