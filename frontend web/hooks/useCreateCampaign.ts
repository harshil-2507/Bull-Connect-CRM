import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useCreateCampaign() {

  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: async (data: any) => {

      const res = await api.post("/campaigns", data)

      return res.data

    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["campaigns"]
      })

    },

  })

}