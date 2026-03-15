"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  LayoutDashboard,
  Users,
  PhoneCall,
  BarChart3,
  Settings,
  Megaphone,
  Database,
} from "lucide-react"

const sections = [
  {
    title: "CRM",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/leads", icon: Database },
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Call Logs", href: "/calls", icon: PhoneCall },
      { label: "Users", href: "/users", icon: Users },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white dark:bg-slate-950 flex flex-col">

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b font-semibold text-lg">
        Bull Connect
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {sections.map((section) => (
          <div key={section.title}>

            <p className="text-xs uppercase text-muted-foreground px-3 mb-2">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                      active
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

          </div>
        ))}

      </div>

    </aside>
  )
}