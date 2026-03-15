import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Campaign } from "@/types/campaign"

export function useCampaigns() {

  return useQuery<Campaign[]>({

    queryKey: ["campaigns"],

    queryFn: async () => {

      const res = await api.get("/campaigns")

      return res.data.data

    },

  })

}