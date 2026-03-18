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

      /* store auth */

      localStorage.setItem("token", data.token)

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      )

      /* role routing */

      const role = data.user.role

      if (role === "ADMIN") {
        router.push("/admin/dashboard")
      }

      else if (role === "MANAGER") {
        router.push("/manager/dashboard")
      }

      else if (role === "TELECALLER") {
        router.push("/telecaller")
      }

      else if (role === "FIELD_EXEC") {
        router.push("/field-exec")
      }

      else {
        router.push("/")
      }

    }

    catch (err) {

      alert("Invalid credentials")

    }

    finally {

      setLoading(false)

    }

  }

  return (

    <div className="flex items-center justify-center h-screen">

      <div className="p-8 border rounded-xl w-80">

        <h1 className="text-xl font-bold mb-4">
          Login
        </h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <input
          className="border p-2 w-full mb-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full p-2 rounded"
        >

          {loading ? "Logging in..." : "Login"}

        </button>

      </div>

    </div>

  )

}