import { useQuery } from "@tanstack/react-query"
import {api} from "@/lib/api"
import { Lead } from "@/types/leads"

export function useLead(id: string) {
  return useQuery<Lead>({
    queryKey: ["lead", id],
    queryFn: async () => {
      const res = await api.get(`/leads/${id}`)
      return res.data
    },
  })
}