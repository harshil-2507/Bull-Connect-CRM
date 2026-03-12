"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  // { label: "Leads", href: "/leads" },
  // { label: "Visits", href: "/visits" },
  // { label: "Deals", href: "/deals" },
  // { label: "Users", href: "/users" },
  // { label: "Analytics", href: "/analytics" },
  // { label: "Settings", href: "/settings" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card">
      <div className="h-16 flex items-center px-6 border-b font-semibold">
        Bull Connect
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}