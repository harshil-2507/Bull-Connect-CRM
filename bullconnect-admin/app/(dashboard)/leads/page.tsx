"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import LeadsTable from "@/components/leads/LeadsTable"
import LeadsToolbar from "@/components/leads/LeadsToolbar"
import LeadsSkeleton from "@/components/leads/LeadsSkeleton"

import { useInfiniteLeads } from "@/hooks/useInfiniteLeads"
import { Button } from "@/components/ui/button"

export default function LeadsPage() {

  const router = useRouter()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")

  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteLeads()

  const observer = useRef<IntersectionObserver | null>(null)

  const lastRowRef = useCallback((node: HTMLTableRowElement | null) => {

    if (isFetchingNextPage) return

    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {

      const first = entries[0]

      if (first?.isIntersecting && hasNextPage) {
        fetchNextPage()
      }

    })

    if (node) observer.current.observe(node)

  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isLoading) return <LeadsSkeleton />

  /* Flatten pages */

  let leads =
    data?.pages?.flatMap((p: any) =>
      Array.isArray(p) ? p : p.leads
    ) ?? []

  /* SEARCH */

  if (search) {

    leads = leads.filter((l: any) =>
      l.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone_number.includes(search)
    )

  }

  /* STATUS FILTER */

  if (status !== "ALL") {

    leads = leads.filter((l: any) =>
      l.status === status
    )

  }

  /* SORT */

  leads = [...leads].sort((a: any, b: any) => {

    const valA = a[sortBy]
    const valB = b[sortBy]

    if (sortDir === "asc") return valA > valB ? 1 : -1
    return valA < valB ? 1 : -1

  })

  const toggleSort = (field: string) => {

    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }

  }

  return (

    <div className="flex flex-col h-full px-6 py-4">

      {/* Header */}

      <div className="flex items-center justify-between mb-4">

        <h1 className="text-2xl font-semibold">
          Leads
        </h1>

        <Button onClick={() => router.push("/leads/new")}>
          Create Lead
        </Button>

      </div>

      {/* Toolbar */}

      <LeadsToolbar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />

      {/* Table */}

      <div className="flex-1 mt-4">

        <LeadsTable
          leads={leads}
          toggleSort={toggleSort}
          lastRowRef={lastRowRef}
        />

      </div>

      {/* Loader */}

      {isFetchingNextPage && (

        <div className="flex justify-center py-4">

          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />

        </div>

      )}

      {!hasNextPage && (
        <p className="text-center text-sm text-muted-foreground pb-4">
          No more leads
        </p>
      )}

    </div>
  )
}