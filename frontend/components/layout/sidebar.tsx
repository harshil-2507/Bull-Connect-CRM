"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Megaphone,
  Database
} from "lucide-react"

const navigationByRole: any = {

  ADMIN: [
    {
      title: "Management",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
        { label: "Leads", href: "/admin/leads", icon: Database }
      ]
    }
  ],

  MANAGER: [
    {
      title: "Management",
      items: [
        { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
        { label: "Campaigns", href: "/manager/campaigns", icon: Megaphone },
        { label: "Assignments", href: "/manager/assignments", icon: PhoneCall }
      ]
    }
  ],

  TELECALLER: [
    {
      title: "Operations",
      items: [
        { label: "My Leads", href: "/telecaller", icon: PhoneCall }
      ]
    }
  ]

}

export default function Sidebar() {

  const pathname = usePathname()
  const router = useRouter()

  const [role, setRole] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const user = JSON.parse(storedUser)

    setRole(user.role)
    setLoading(false)

  }, [])

  if (loading) return null

  const sections = navigationByRole[role] || []

  return (

    <aside className="w-64 bg-[#0f172a] text-white flex flex-col h-full border-r border-slate-800">

      {/* Logo */}

      <div className="h-16 flex items-center px-6 border-b border-white/5 font-semibold text-lg text-blue-400">
        Bull Connect
      </div>

      {/* Role */}

      <div className="text-[10px] uppercase tracking-wider text-slate-500 px-6 py-3 border-b border-white/5 bg-black/20">
        {role} PANEL
      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto p-4 space-y-8">

        {sections.map((section: any) => (

          <div key={section.title}>

            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-4">
              {section.title}
            </p>

            <div className="space-y-1">

              {section.items.map((item: any) => {

                const active = pathname.startsWith(item.href)
                const Icon = item.icon

                return (

                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group",
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >

                    <Icon size={18} className={cn(
                      "transition-colors",
                      active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                    )} />

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