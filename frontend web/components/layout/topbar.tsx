"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Bell, Search } from "lucide-react"
import GlobalSearch from "./global-search"

export default function Topbar() {
  return (
    <>
      <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-6">

        {/* Global Search Trigger */}
        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            )
          }
          className="
            flex items-center gap-3
            w-[420px]
            border border-border/50
            rounded-lg
            px-4 h-10
            text-sm
            bg-muted/40
            hover:bg-muted/70
            transition
            text-muted-foreground
          "
        >
          <Search size={16} />
          Search leads, users, campaigns...
          <span className="ml-auto text-xs opacity-60">⌘K</span>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-5">

          {/* Notifications */}
          <button className="relative hover:opacity-80 transition">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      <GlobalSearch />
    </>
  )
}