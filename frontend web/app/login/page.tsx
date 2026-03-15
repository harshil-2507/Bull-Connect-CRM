"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "TELECALLER"
  | "GROUND_MANAGER"
  | "FIELD_EXEC"

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        router.push("/admin/dashboard")
        break

      case "MANAGER":
        router.push("/manager/dashboard")
        break

      case "TELECALLER":
        router.push("/telecaller/todo")
        break

      case "GROUND_MANAGER":
        router.push("/ground-manager/map")
        break

      case "FIELD_EXEC":
        router.push("/field-exec/visits")
        break

      default:
        router.push("/admin/dashboard")
    }
  }

  const handleLogin = async () => {
    try {
      setLoading(true)

      const { data } = await api.post("/login", {
        username,
        password,
      })

      const token = data.token
      const role: UserRole = data.user.role

      localStorage.setItem("token", token)
      localStorage.setItem("role", role)

      redirectByRole(role)
    } catch (err) {
      alert("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-950">
      <div className="p-8 border rounded-xl w-80 bg-white dark:bg-slate-900">

        <h1 className="text-xl font-bold mb-6 text-center">
          Bull Connect CRM
        </h1>

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition text-white w-full p-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  )
}