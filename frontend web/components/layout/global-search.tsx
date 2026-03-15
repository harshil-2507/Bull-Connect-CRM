"use client"

import { useEffect, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export default function GlobalSearch() {

  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  /**
   * Keyboard shortcut (⌘K)
   */
  useEffect(() => {

    const down = (e: KeyboardEvent) => {

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {

        e.preventDefault()
        setOpen((prev) => !prev)

      }

    }

    document.addEventListener("keydown", down)

    return () => document.removeEventListener("keydown", down)

  }, [])

  /**
   * API Search
   */
  const { data } = useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {

      if (!query) return null

      const res = await api.get(`/search?q=${query}`)

      return res.data

    },
    enabled: query.length > 1,
  })

  return (

    <CommandDialog open={open} onOpenChange={setOpen}>

      <CommandInput
        placeholder="Search leads, users, campaigns..."
        value={query}
        onValueChange={setQuery}
      />

      <CommandList>

        <CommandEmpty>
          No results found.
        </CommandEmpty>

        {/* Leads */}
        {data?.leads?.length > 0 && (

          <CommandGroup heading="Leads">

            {data.leads.map((lead: any) => (

              <CommandItem
                key={lead.id}
                onSelect={() => {

                  router.push(`/leads/${lead.id}`)
                  setOpen(false)

                }}
              >
                {lead.farmer_name}
              </CommandItem>

            ))}

          </CommandGroup>

        )}

        {/* Users */}
        {data?.users?.length > 0 && (

          <CommandGroup heading="Users">

            {data.users.map((user: any) => (

              <CommandItem
                key={user.id}
                onSelect={() => {

                  router.push(`/users/${user.id}`)
                  setOpen(false)

                }}
              >
                {user.name}
              </CommandItem>

            ))}

          </CommandGroup>

        )}

      </CommandList>

    </CommandDialog>

  )
}