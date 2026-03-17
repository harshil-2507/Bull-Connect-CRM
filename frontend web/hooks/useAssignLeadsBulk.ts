"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { AssignmentPayload } from "@/types/assignments"

export function useAssignLeadsBulk() {

  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: async (assignments: AssignmentPayload[]) => {

      const res = await api.post(
        "/manager/assign-leads-bulk",
        { assignments }
      )

      return res.data
    },

    onSuccess: () => {

      // refresh data
      queryClient.invalidateQueries({ queryKey: ["unassigned-leads"] })
      queryClient.invalidateQueries({ queryKey: ["assignments"] })

    }

  })
}