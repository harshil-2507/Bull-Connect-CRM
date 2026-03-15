"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  LayoutDashboard,
  Users,
  PhoneCall,
  BarChart3,
  Megaphone,
  Database,
  Map,
  Route,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: any
}

type NavSection = {
  title: string
  items: NavItem[]
}

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "TELECALLER"
  | "GROUND_MANAGER"
  | "FIELD_EXEC"

const navigationByRole: Record<UserRole, NavSection[]> = {
  ADMIN: [
    {
      title: "CRM",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Leads", href: "/admin/leads", icon: Database },
        { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Users", href: "/admin/users", icon: Users },
      ],
    },
    {
      title: "Analytics",
      items: [
        { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      ],
    },
  ],

  MANAGER: [
    {
      title: "Management",
      items: [
        { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
        { label: "Campaigns", href: "/manager/campaigns", icon: Megaphone },
        { label: "Assignments", href: "/manager/assignments", icon: Users },
      ],
    },
  ],

  TELECALLER: [
    {
      title: "My Work",
      items: [
        { label: "My Leads", href: "/telecaller/leads", icon: Database },
        { label: "To-Do List", href: "/telecaller/todo", icon: PhoneCall },
      ],
    },
  ],

  GROUND_MANAGER: [
    {
      title: "Field Operations",
      items: [
        { label: "Visit Map", href: "/ground-manager/map", icon: Map },
        { label: "Visit Requests", href: "/ground-manager/visits", icon: Database },
      ],
    },
  ],

  FIELD_EXEC: [
    {
      title: "Field Work",
      items: [
        { label: "My Visits", href: "/field-exec/visits", icon: Database },
        { label: "Route", href: "/field-exec/route", icon: Route },
      ],
    },
  ],
}

export default function Sidebar() {
  const pathname = usePathname()

  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") as UserRole)
      : "ADMIN"

  const sections = navigationByRole[role] ?? navigationByRole.ADMIN

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