import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Campaign } from "@/types/campaign"

export function useCampaigns() {

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null

  return useQuery<Campaign[]>({

    queryKey: ["campaigns", role],

    queryFn: async () => {

      const res = await api.get("/campaigns")

      return res.data.data

    },

  })

}