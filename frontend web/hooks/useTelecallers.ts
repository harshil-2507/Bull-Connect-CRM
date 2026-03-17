"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Telecaller } from "@/types/assignments"

export function useTelecallers() {

  return useQuery({

    queryKey: ["telecallers"],

    queryFn: async () => {

      const res = await api.get("/manager/telecallers")
      return res.data as Telecaller[]

    }

  })
}