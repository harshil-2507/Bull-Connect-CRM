import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useFieldMap() {
  return useQuery({
    queryKey: ["field-map"],
    queryFn: async () => {
      const { data } = await api.get("/field-manager/map")
      return data.data
    }
  })
}