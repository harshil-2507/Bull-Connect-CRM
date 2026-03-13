"use client"

import { useState } from "react"
import { useCreateLead } from "@/hooks/useCreateLead"

export default function LeadForm() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const createLead = useCreateLead()

  const handleSubmit = () => {
    createLead.mutate({
      farmer_name: name,
      phone_number: phone,
    })
  }

  return (
    <div className="space-y-4">

      <input
        className="border p-2 w-full"
        placeholder="Farmer Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 w-full"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleSubmit}
      >
        Create Lead
      </button>
    </div>
  )
}