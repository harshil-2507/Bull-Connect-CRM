import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useCampaignStats() {

  return useQuery({

    queryKey: ["campaign-stats"],

    queryFn: async () => {

      const res = await api.get("/campaigns/stats")

      return res.data

    },

  })

}