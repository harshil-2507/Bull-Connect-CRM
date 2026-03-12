"use client"

import { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  useAuth()

  return <>{children}</>
}