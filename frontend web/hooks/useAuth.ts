"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    if (!token) {
      router.replace("/login")
      return
    }

    if (!role) {
      router.replace("/login")
      return
    }
  }, [router])
}