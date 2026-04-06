"use client"

import { useState } from "react"
import { useUsers } from "@/hooks/useUsers"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Layers,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import CreateUserDialog from "@/components/users/CreateUserDialog"
import UsersStats from "@/components/users/UsersStats"
import UsersTable from "@/components/users/UsersTable"

export default function UsersPage() {
  const { data: users, isLoading } = useUsers()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  const filteredUsers = (users || []).filter((user: any) => {
    const name = user?.name?.toLowerCase() || ""
    const username = user?.username?.toLowerCase() || ""
    const phone = user?.phone?.toString() || ""
    const query = search.toLowerCase()

    const matchesSearch = 
      name.includes(query) || 
      username.includes(query) || 
      phone.includes(query)

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">User Administration</h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Manage team hierarchy, permissions, and performance monitoring.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white gap-2 text-slate-600 font-bold px-5 shadow-sm">
            <ShieldCheck size={18} className="text-blue-600" />
            Edit Permissions
          </Button>
          <CreateUserDialog />
        </div>
      </div>

      {/* KPI Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <UsersStats users={users || []} />
      )}

      {/* Filters Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search team members by name, number, or username..."
            className="w-full bg-slate-50 border-none rounded-xl h-12 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="h-8 w-px bg-slate-100" />

        <div className="flex gap-2 pr-2">
          <select
            className="border-slate-100 bg-slate-50/50 rounded-xl px-4 h-12 text-xs font-bold uppercase tracking-wider outline-none text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all min-w-[200px]"
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
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
            <Layers size={18} />
          </Button>
        </div>
      </div>

      {/* Team Directory Table */}
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-3xl" />
      ) : (
        <UsersTable users={filteredUsers} />
      )}

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10">
          Bull Connect © 2026. All team data processed with precision.
      </div>
    </div>
  )
}