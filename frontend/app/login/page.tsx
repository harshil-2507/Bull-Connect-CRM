"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MANAGER: "/manager/dashboard",
  TELECALLER: "/telecaller",
  FIELD_EXEC: "/field-exec",
  FIELD_MANAGER: "/field-manager" 
}

export default function LoginPage() {

  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError("")

      const { data } = await api.post("/login", {
        username,
        password
      })

      //  Store auth
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      const role = data.user.role

      //  Centralized routing
      const redirectPath = ROLE_REDIRECT[role] || "/"

      router.replace(redirectPath)

    } catch (err: any) {
      console.error("LOGIN ERROR:", err.response?.data || err.message)
      setError("Invalid username or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">

      <div className="p-8 border rounded-xl w-80 bg-white shadow-md">

        <h1 className="text-xl font-bold mb-4 text-center">
          Bull Connect CRM
        </h1>

        {/* ERROR */}
        {error && (
          <div className="text-red-500 text-sm mb-3 text-center">
            {error}
          </div>
        )}

        <input
          className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full p-2 rounded transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>

    </div>
  )
}