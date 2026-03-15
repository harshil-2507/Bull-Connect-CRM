import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

type Payload = {
  id: string
  is_active: boolean
}

export function useDeactivateUser() {

  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: async ({ id, is_active }: Payload) => {

      const res = await api.patch(`/admin/users/${id}/deactivate`, {
        is_active
      })

      return res.data
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"]
      })
    }

  })

}