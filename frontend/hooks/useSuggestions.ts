import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useSuggestions(taluka: string) {
  return useQuery({
    queryKey: ["suggestions", taluka],
    queryFn: async () => {
      const { data } = await api.get(`/field-manager/suggestions/${taluka}`)
      return data
    },
    enabled: !!taluka
  })
}