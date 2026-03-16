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
      <header
        className="
        h-16
        border-b
        border-slate-700
        bg-slate-900
        text-white
        flex
        items-center
        justify-between
        px-6
      "
      >

        {/* Search */}

        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            )
          }
          className="
            flex items-center gap-3
            w-[420px]
            border border-slate-700
            rounded-lg
            px-4 h-10
            text-sm
            bg-slate-700
            hover:bg-slate-800
            transition
            text-slate-300
          "
        >
          <Search size={16} />
          Search leads, users, campaigns...
          <span className="ml-auto text-xs opacity-60">⌘K</span>
        </button>

        {/* Right controls */}

        <div className="flex items-center gap-5">

          {/* Notifications */}

          <button className="relative hover:opacity-80 transition">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Avatar */}

          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <Avatar className="cursor-pointer">
                <AvatarFallback className="bg-blue-600 text-white">
                  AD
                </AvatarFallback>
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