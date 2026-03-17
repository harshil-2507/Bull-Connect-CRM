import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useCampaignStats() {

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null

  return useQuery({

    queryKey: ["campaign-stats", role],

    queryFn: async () => {

      const res = await api.get("/campaigns/stats")

      return res.data

    },

  })

}