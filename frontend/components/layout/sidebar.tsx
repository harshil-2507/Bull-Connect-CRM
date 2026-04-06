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
  Database,
  LogOut,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigationByRole: any = {

  ADMIN: [
    {
      title: "Main Menu",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
        { label: "Leads", href: "/admin/leads", icon: Database },
        { label: "Users", href: "/admin/users", icon: Users },
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

    <aside className="w-64 bg-white flex flex-col h-full border-r border-slate-200">

      {/* Logo */}

      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-100">
        <div className="text-blue-600 font-bold text-lg leading-tight">
          Bull Connect
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          OPERATIONAL SUITE
        </div>
      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">

        {sections.map((section: any) => (

          <div key={section.title}>

            <div className="space-y-1">

              {section.items.map((item: any) => {

                const active = pathname.startsWith(item.href)
                const Icon = item.icon

                return (

                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all group relative",
                      active
                        ? "text-blue-600 bg-blue-50/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >

                    {active && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l-full" />
                    )}

                    <Icon size={20} className={cn(
                      "transition-colors",
                      active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />

                    {item.label}

                  </Link>

                )

              })}

            </div>

          </div>

        ))}

      </div>

      {/* Bottom Actions */}

      <div className="p-4 border-t border-slate-100 space-y-4">

        <Button
          className="w-full justify-start gap-3 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200"
          onClick={() => router.push("/admin/leads/new")}
        >
          <div className="bg-white/20 p-1 rounded-md">
            <Plus size={16} />
          </div>
          Create New Lead
        </Button>

        <button 
          onClick={() => {
            localStorage.clear()
            window.location.href = "/login"
          }}
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors w-full text-sm font-medium"
        >
          <LogOut size={18} />
          Log Out
        </button>

      </div>

    </aside>

  )

}
