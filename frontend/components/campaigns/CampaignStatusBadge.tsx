import { Badge } from "@/components/ui/badge"

export default function CampaignStatusBadge({ status }: { status: string }) {

  const colorMap: any = {
    ACTIVE: "bg-green-100 text-green-700",
    DRAFT: "bg-gray-100 text-gray-700",
    PAUSED: "bg-orange-100 text-orange-700",
    COMPLETED: "bg-blue-100 text-blue-700",
  }

  return (
    <Badge className={colorMap[status] || ""}>
      {status}
    </Badge>
  )

}