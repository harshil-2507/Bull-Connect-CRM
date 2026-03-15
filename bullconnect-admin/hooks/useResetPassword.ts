import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useResetPassword() {

return useMutation({

mutationFn: async ({id, newPassword}:{id:string,newPassword:string}) => {

await api.patch(`/admin/users/${id}/reset-password`,{
newPassword
})

}

})

}