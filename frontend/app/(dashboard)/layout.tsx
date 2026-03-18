"use client"

import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <div className="flex h-screen bg-slate-50 relative">

      {/* Sidebar */}

      <Sidebar />

      {/* Main */}

      <div className="flex flex-col flex-1 overflow-hidden relative z-10">

        {/* Topbar */}

        <Topbar />

        {/* Page Content */}

        <main className="flex-1 overflow-y-auto p-8">

          {children}

        </main>

      </div>

    </div>

  )

}