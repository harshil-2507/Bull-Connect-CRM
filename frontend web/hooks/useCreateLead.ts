import { useMutation, useQueryClient } from "@tanstack/react-query"
import {api} from "@/lib/api"

export function useCreateLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/leads", data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] })
    },
  })
}