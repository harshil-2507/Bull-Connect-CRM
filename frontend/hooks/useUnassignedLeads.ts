"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Lead } from "@/types/assignments"

export function useUnassignedLeads(campaignId?: string) {

  return useQuery({

    queryKey: ["unassigned-leads", campaignId],

    queryFn: async () => {

      if (!campaignId) return []

      const res = await api.get(
        `/manager/campaigns/${campaignId}/unassigned-leads`
      )

      return res.data as Lead[]

    },

    enabled: !!campaignId // only run when campaignId exists

  })
}