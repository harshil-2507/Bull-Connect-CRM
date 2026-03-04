"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { DashboardSummary } from "@/types/dashboard"

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>(
        "/admin/dashboard/summary"
      )
      return data
    },
  })
}