import axios from "axios"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
})

/* Attach token */

api.interceptors.request.use((config) => {

  if (typeof window !== "undefined") {

    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

  }

  return config

})

/* Error logging */

api.interceptors.response.use(

  (response) => response,

  (error) => {

    console.error(
      "API Error:",
      error?.response?.data || error.message
    )

    return Promise.reject(error)

  }

)