"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface PipelineStage {
  status: string
  count: number
}

export const usePipelineAnalytics = (from?: string, to?: string) => {
  return useQuery<PipelineStage[]>({
    queryKey: ["pipeline-analytics", from, to],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard/pipeline", {
        params: { from, to },
      })

      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}