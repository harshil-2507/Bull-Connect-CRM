import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useSmartAssign() {
  return useMutation({
    mutationFn: async (taluka: string) => {
      const { data } = await api.post("/field-manager/assign/smart", { taluka })
      return data
    }
  })
}