"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty
} from "@/components/ui/command"

import { api } from "@/lib/api"

type Campaign = {
  id: string
  name: string
}

type User = {
  id: string
  name: string
}

export default function GlobalSearch() {

  const [open, setOpen] = useState(false)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [users, setUsers] = useState<User[]>([])

  const router = useRouter()

  /* CMD + K */

  useEffect(() => {

    const down = (e: KeyboardEvent) => {

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }

    }

    document.addEventListener("keydown", down)

    return () => document.removeEventListener("keydown", down)

  }, [])

  /* LOAD DATA */

  useEffect(() => {

    if (!open) return

    loadData()

  }, [open])

  async function loadData() {

    try {

      const [campaignRes, usersRes] = await Promise.all([
        api.get("/campaigns"),
        api.get("/admin/users")
      ])

      setCampaigns(campaignRes.data?.data || [])
      setUsers(usersRes.data?.data || [])

    } catch (err) {

      console.error("Global search load error:", err)

    }

  }
  const navigate = (path: string) => {

    setOpen(false)
    router.push(path)

  }

  return (

    <CommandDialog open={open} onOpenChange={setOpen}>

      <CommandInput placeholder="Search leads, users, campaigns..." />

      <CommandList>

        <CommandEmpty>No results found</CommandEmpty>

        {/* USERS */}

        <CommandGroup heading="Users">

          {users.slice(0, 6).map((user) => (

            <CommandItem
              key={user.id}
              onSelect={() => navigate(`/admin/users`)}
            >
              {user.name}
            </CommandItem>

          ))}

        </CommandGroup>

        {/* CAMPAIGNS */}

        <CommandGroup heading="Campaigns">

          {campaigns.slice(0, 6).map((campaign) => (

            <CommandItem
              key={campaign.id}
              onSelect={() =>
                navigate(`/admin/campaigns/${campaign.id}`)
              }
            >
              {campaign.name}
            </CommandItem>

          ))}

        </CommandGroup>

        {/* PAGES */}

        <CommandGroup heading="Pages">

          <CommandItem onSelect={() => navigate("/admin/dashboard")}>
            Dashboard
          </CommandItem>

          <CommandItem onSelect={() => navigate("/admin/users")}>
            Users
          </CommandItem>

          <CommandItem onSelect={() => navigate("/admin/campaigns")}>
            Campaigns
          </CommandItem>

          <CommandItem onSelect={() => navigate("/admin/leads")}>
            Leads
          </CommandItem>

        </CommandGroup>

      </CommandList>

    </CommandDialog>

  )

}