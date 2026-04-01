import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useTalukaDetails(taluka: string) {
  return useQuery({
    queryKey: ["taluka-details", taluka],
    queryFn: async () => {
      const { data } = await api.get(`/field-manager/taluka/${taluka}`)
      return data
    },
    enabled: !!taluka
  })
}