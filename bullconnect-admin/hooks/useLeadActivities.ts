"use client"

import { useEffect, useState } from "react"

export type LeadActivity = {
  type: string
  id: string
  activity_type: string
  description: string
  created_at: string
}

export function useLeadActivities(leadId: string) {

  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    if (!leadId) return

    const fetchActivities = async () => {

      try {

        const token = localStorage.getItem("token")

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/activities`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await res.json()

        setActivities(data)

      } catch (err) {

        console.error("Failed to fetch activities", err)

      } finally {

        setLoading(false)

      }

    }

    fetchActivities()

  }, [leadId])

  return { activities, loading }

}