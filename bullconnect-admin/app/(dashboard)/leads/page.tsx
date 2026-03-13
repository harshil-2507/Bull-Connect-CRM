"use client"

import { useState } from "react"
import { useLeads } from "@/hooks/useLeads"
import LeadsTable from "@/components/leads/LeadsTable"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LeadsPage() {

  const router = useRouter()

  const [page, setPage] = useState(1)

  const { data, isLoading } = useLeads(page)

  if (isLoading) return <div>Loading leads...</div>

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>

        <Button onClick={() => router.push("/leads/new")}>
          Create Lead
        </Button>
      </div>

      <LeadsTable leads={data?.leads ?? []} />

      <div className="flex gap-3">

        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>

        <Button
          disabled={page * data.limit >= data.total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>

      </div>

    </div>
  )
}