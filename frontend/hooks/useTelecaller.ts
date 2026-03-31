// frontend/hooks/useTelecaller.ts

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useWorkQueue() {
  return useQuery({
    queryKey: ["telecaller-queue"],
    queryFn: async () => {
      const res = await api.get("telecaller/queue")
      return res.data
    }
  })
}

export function useStats() {
  return useQuery({
    queryKey: ["telecaller-stats"],
    queryFn: async () => {
      const res = await api.get("telecaller/stats")
      return res.data
    }
  })
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["telecaller-leaderboard"],
    queryFn: async () => {
      const res = await api.get("telecaller/leaderboard")
      return res.data
    }
  })
}

export function useCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("telecaller/call", payload)

      if (res.data?.error) {
        throw new Error(res.data.error)
      }

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telecaller-queue"] })
      queryClient.invalidateQueries({ queryKey: ["telecaller-stats"] })
    },
    onError: (err: any) => {
      alert(err.message || "Something went wrong")
    }
  })
}