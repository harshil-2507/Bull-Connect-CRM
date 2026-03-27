import { useInfiniteQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useInfiniteLeads() {

  return useInfiniteQuery({

    queryKey: ["leads"],

    initialPageParam: 1,

    queryFn: async ({ pageParam = 1 }) => {

      const res = await api.get(`/leads?page=${pageParam}`)
      return res.data

    },

    getNextPageParam: (lastPage, pages) => {

      if (!lastPage || lastPage.length === 0) {
        return undefined
      }

      return pages.length + 1

    }

  })

}