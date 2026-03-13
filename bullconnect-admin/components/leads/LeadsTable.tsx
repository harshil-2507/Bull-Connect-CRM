"use client"

import { Lead } from "@/types/leads"
import { useRouter } from "next/navigation"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter()

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Farmer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Village</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => router.push(`/leads/${lead.id}`)}
            >
              <TableCell className="font-medium">
                {lead.farmer_name}
              </TableCell>

              <TableCell>{lead.phone_number}</TableCell>

              <TableCell>{lead.village ?? "-"}</TableCell>

              <TableCell>{lead.status}</TableCell>

              <TableCell>
                {new Date(lead.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}