import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useTeamStatus() {
  return useQuery({
    queryKey: ["team-status"],
    queryFn: async () => {
      const { data } = await api.get("/field-manager/team/status")
      return data.data
    }
  })
}