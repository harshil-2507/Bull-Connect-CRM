"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Telecaller {
  telecallerId: string
  name: string
  assigned: number
  contacted: number
  visitRequested: number
  visitCompleted: number
  closed: number
}

export const useTelecallerPerformance = (
  from?: string,
  to?: string
) => {
  return useQuery<Telecaller[]>({
    queryKey: ["telecaller-performance", from, to],
    queryFn: async () => {
      const { data } = await api.get(
        "/admin/dashboard/telecaller-performance",
        {
          params: { from, to },
        }
      )

      return data
    },
  })
}