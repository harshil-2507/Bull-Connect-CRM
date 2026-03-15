"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export function useUpdateLead(leadId: string) {

  const queryClient = useQueryClient()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

  return useMutation({

    mutationFn: async (data: any) => {

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      return res.data

    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["lead", leadId]
      })

      queryClient.invalidateQueries({
        queryKey: ["leads"]
      })

    }

  })

}