"use client"

import { useCampaigns } from "@/hooks/useCampaigns"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"

import CampaignStatusBadge from "./CampaignStatusBadge"
import UploadLeadsDialog from "./UploadLeadsDialog"

export default function CampaignTable() {

  const { data, isLoading } = useCampaigns()

  if (isLoading) return <div>Loading campaigns...</div>

  return (

    <div className="border rounded-md">

      <Table>

        <TableHeader>

          <TableRow>

            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Total Leads</TableHead>
            <TableHead>Actions</TableHead>

          </TableRow>

        </TableHeader>

        <TableBody>

          {data?.map((campaign:any) => (

            <TableRow key={campaign.id}>

              <TableCell>
                {campaign.name}
              </TableCell>

              <TableCell>
                <CampaignStatusBadge status={campaign.status}/>
              </TableCell>

              <TableCell>
                {campaign.start_date?.slice(0,10)}
              </TableCell>

              <TableCell>
                {campaign.end_date?.slice(0,10)}
              </TableCell>

              <TableCell>
                {campaign.total_leads}
              </TableCell>

              <TableCell>

                <UploadLeadsDialog campaignId={campaign.id} />

              </TableCell>

            </TableRow>

          ))}

        </TableBody>

      </Table>

    </div>

  )
}