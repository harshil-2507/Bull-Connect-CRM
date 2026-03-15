import { useInfiniteQuery } from "@tanstack/react-query"

export function useInfiniteLeads() {

  return useInfiniteQuery({

    queryKey: ["leads"],

    initialPageParam: 1,

    queryFn: async ({ pageParam = 1 }) => {

      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:3000/leads?page=${pageParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (!res.ok) {
        throw new Error("Failed to fetch leads")
      }

      return res.json()

    },

    getNextPageParam: (lastPage, pages) => {

      if (!lastPage || lastPage.length === 0) {
        return undefined
      }

      return pages.length + 1

    }

  })

}