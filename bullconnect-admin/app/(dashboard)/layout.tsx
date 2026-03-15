"use client"

import { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {

  useAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>

    </div>
  )
}