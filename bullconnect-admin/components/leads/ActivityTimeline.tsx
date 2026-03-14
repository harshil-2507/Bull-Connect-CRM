"use client"

import { useLeadActivities } from "@/hooks/useLeadActivities"
import ActivityItem from "./ActivityItem"
import { Lead } from "@/types/leads"
import { useState } from "react"

type Props = {
  lead: Lead
}

const TOP_K = 5

export default function ActivityTimeline({ lead }: Props) {

  const { activities, loading } = useLeadActivities(lead.id)

  const [showAllToday, setShowAllToday] = useState(false)

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading activity...
      </div>
    )
  }

  if (!activities?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No activity yet
      </div>
    )
  }

  const today = new Date()

  const todayActivities = activities.filter((a) => {
    const d = new Date(a.created_at)
    return d.toDateString() === today.toDateString()
  })

  const earlierActivities = activities.filter((a) => {
    const d = new Date(a.created_at)
    return d.toDateString() !== today.toDateString()
  })

  const visibleToday = showAllToday
    ? todayActivities
    : todayActivities.slice(0, TOP_K)

  return (

    <div className="relative pl-4">

      {/* timeline spine */}

      <div className="absolute left-2 top-0 bottom-0 w-[2px] bg-gray-200"/>

      {/* TODAY */}

      {todayActivities.length > 0 && (

        <div className="mb-4">

          <p className="text-xs text-muted-foreground mb-2">
            Today
          </p>

          <div className="space-y-3">

            {visibleToday.map((activity) => (

              <ActivityItem
                key={activity.id}
                type={activity.type}
                description={activity.description}
                createdAt={activity.created_at}
              />

            ))}

          </div>

          {todayActivities.length > TOP_K && (

            <button
              onClick={() => setShowAllToday(!showAllToday)}
              className="text-xs text-blue-600 mt-3 hover:underline"
            >

              {showAllToday
                ? "Show less"
                : `Show more (${todayActivities.length - TOP_K})`}

            </button>

          )}

        </div>

      )}

      {/* EARLIER */}

      {earlierActivities.length > 0 && (

        <div>

          <p className="text-xs text-muted-foreground mb-2">
            Earlier
          </p>

          <div className="space-y-3">

            {earlierActivities.slice(0, 3).map((activity) => (

              <ActivityItem
                key={activity.id}
                type={activity.type}
                description={activity.description}
                createdAt={activity.created_at}
              />

            ))}

          </div>

        </div>

      )}

    </div>

  )

}