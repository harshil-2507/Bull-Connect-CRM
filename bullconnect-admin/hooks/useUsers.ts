import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/admin/users")
      return res.data
    },
  })
}