"use client"

import { useState } from "react"

import UsersTable from "@/components/users/UsersTable"
import CreateUserDialog from "@/components/users/CreateUserDialog"
import UsersStats from "@/components/users/UsersStats"

import { useUsers } from "@/hooks/useUsers"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function UsersPage() {

  const { data: users } = useUsers()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  const filteredUsers =
    (users || []).filter((user: any) => {

      const name = user?.name?.toLowerCase() || ""
      const username = user?.username?.toLowerCase() || ""
      const phone = user?.phone?.toString() || ""

      const query = search.toLowerCase()

      const matchesSearch =
        name.includes(query) ||
        username.includes(query) ||
        phone.includes(query)

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter

      return matchesSearch && matchesRole

    })

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-semibold">
            Users
          </h1>

          <p className="text-muted-foreground">
            Manage CRM users and roles
          </p>

        </div>

        <CreateUserDialog />

      </div>


      {/* Users Stats */}

      <UsersStats users={users || []} />


      {/* Filters */}

      <div className="flex items-center gap-4">

        {/* Search */}

        <div className="relative w-[300px]">

          <Search
            size={16}
            className="absolute left-3 top-3 text-muted-foreground"
          />

          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        {/* Role Filter */}

        <select
          className="border rounded-md h-10 px-3"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >

          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="TELECALLER">Telecaller</option>
          <option value="FIELD_MANAGER">Field Manager</option>
          <option value="FIELD_EXEC">Field Exec</option>

        </select>

      </div>


      {/* Users Table */}

      <UsersTable users={filteredUsers} />

    </div>

  )
}