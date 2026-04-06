"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Bell, Search, Settings, HelpCircle } from "lucide-react"
import GlobalSearch from "./global-search"

export default function Topbar() {

  return (

    <>
      <header
        className="
        h-20
        border-b
        border-slate-100
        bg-white/80
        backdrop-blur-md
        text-slate-900
        flex
        items-center
        justify-between
        px-8
        sticky
        top-0
        z-30
      "
      >

        {/* Left side: Search */}

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search campaigns..."
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl w-[320px] text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                )
              }
            />
          </div>
        </div>

        {/* Right side: Controls & Profile */}

        <div className="flex items-center gap-6">

          <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Settings size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <HelpCircle size={20} />
            </button>
          </div>

          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">Admin User</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Region Lead</span>
                </div>
                <Avatar className="h-10 w-10 border-2 border-slate-100">
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                    AD
                  </AvatarFallback>
                </Avatar>
              </div>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 mt-2">

              <DropdownMenuItem className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px] font-bold">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Admin User</span>
                  <span className="text-[10px] text-slate-400">admin@bullconnect.com</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="mt-2 text-red-600 cursor-pointer"
                onClick={() => {
                   localStorage.clear()
                   window.location.href = "/login"
                }}
              >
                Logout
              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>

        </div>

      </header>

      <GlobalSearch />

    </>

  )

}