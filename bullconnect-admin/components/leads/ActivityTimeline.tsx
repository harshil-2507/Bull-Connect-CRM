"use client"

import { Lead } from "@/types/leads"
import { useLeadActivities } from "@/hooks/useLeadActivities"
import ActivityItem from "./ActivityItem"

type Props = {
  lead: Lead
}

export default function ActivityTimeline({ lead }: Props) {

  const { activities, loading } = useLeadActivities(lead.id)

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading timeline...
      </div>
    )
  }

  if (!activities.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No activity yet
      </div>
    )
  }

  return (

    <div className="space-y-4 mt-4">

      {activities.map((activity) => (

        <ActivityItem
          key={activity.id}
          type={activity.activity_type}
          description={activity.description}
          createdAt={activity.created_at}
        />

      ))}

    </div>

  )

}