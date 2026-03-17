"use client"

import { Button } from "@/components/ui/button"

export type AssignmentMode = "AUTO" | "MANUAL"

interface Props {
  mode: AssignmentMode
  setMode: (mode: AssignmentMode) => void
}

export default function AssignmentModeToggle({ mode, setMode }: Props) {

  return (
    <div className="flex gap-2">
      <Button
        variant={mode === "AUTO" ? "default" : "outline"}
        onClick={() => setMode("AUTO")}
      >
        Auto
      </Button>

      <Button
        variant={mode === "MANUAL" ? "default" : "outline"}
        onClick={() => setMode("MANUAL")}
      >
        Manual
      </Button>
    </div>
  )
}