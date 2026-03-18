"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Assignment } from "@/types/assignments"

export function useAssignments() {

  return useQuery({

    queryKey: ["assignments"],

    queryFn: async () => {

      const res = await api.get("/manager/tele-assignments")
      return res.data as Assignment[]

    }

  })
}