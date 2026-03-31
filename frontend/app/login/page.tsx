"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function LoginPage() {

  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)

      const { data } = await api.post("/login", {
        username,
        password
      })

      console.log("LOGIN RESPONSE:", data)

      //  Store token + user
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      const role = data.user.role

      //  Direct routing (no timeout needed)
      if (role === "ADMIN") {
        router.replace("/admin/dashboard")
      }

      else if (role === "MANAGER") {
        router.replace("/manager/dashboard")
      }

      else if (role === "TELECALLER") {
        router.replace("/telecaller") //  FIXED
      }

      else if (role === "FIELD_EXEC") {
        router.replace("/field-exec")
      }

      else {
        router.replace("/")
      }

    } catch (err: any) {
      console.error("LOGIN ERROR:", err.response?.data || err.message)
      alert("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">

      <div className="p-8 border rounded-xl w-80 bg-white shadow-sm">

        <h1 className="text-xl font-bold mb-4 text-center">
          Login
        </h1>

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