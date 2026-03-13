import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useLeads(page: number) {
  return useQuery({
    queryKey: ["leads", page],
    queryFn: async () => {
      const res = await api.get(`/leads?page=${page}&limit=20`)
      return res.data
    }
  })
}