"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useAuth() {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")

    console.log("AUTH CHECK:", { token, userStr })

    //  If no token OR no user → redirect
    if (!token || !userStr) {
      router.replace("/login")
      return
    }

    try {
      const user = JSON.parse(userStr)

      if (!user.role) {
        router.replace("/login")
        return
      }

      //  Everything ok
      setLoading(false)

    } catch (err) {
      console.error("Invalid user JSON")
      router.replace("/login")
    }

  }, [])

  return { loading }
}