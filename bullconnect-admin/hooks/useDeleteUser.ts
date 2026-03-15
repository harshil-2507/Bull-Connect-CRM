import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useDeleteUser() {

const queryClient = useQueryClient()

return useMutation({

mutationFn: async (id: string) => {
await api.delete(`/admin/users/${id}`)
},

onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["users"] })
}

})

}