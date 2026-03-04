"use client"

import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-6 h-6 bg-white dark:bg-black rounded-full shadow-md"
        style={{ x: isDark ? 24 : 0 }}
      />
    </button>
  )
}