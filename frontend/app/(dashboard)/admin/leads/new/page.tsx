"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateLeadPage() {

  const router = useRouter()

  const [form, setForm] = useState({
    farmer_name: "",
    phone_number: "",
    farmer_type: "",

    village: "",
    taluka: "",
    district: "",
    state: "",

    bull_centre: "",
    crop_type: "",
    acreage: "",
    total_land_bigha: "",

    interested_in_warehouse: false,
    previous_experience: false
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: any) => {

    const { name, value, type, checked } = e.target

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault()
    setLoading(true)

    const payload = {
      farmer_name: form.farmer_name,
      phone_number: form.phone_number,
      farmer_type: form.farmer_type,

      village: form.village,
      taluka: form.taluka,
      district: form.district,
      state: form.state,

      bull_centre: form.bull_centre,
      crop_type: form.crop_type,

      acreage: Number(form.acreage) || null,
      total_land_bigha: Number(form.total_land_bigha) || null,

      interested_in_warehouse: form.interested_in_warehouse,
      previous_experience: form.previous_experience
    }

    try {

      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:3000/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text()
        console.error("Backend error:", text)
        throw new Error("Failed to create lead")
      }

      router.push("/leads")

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="max-w-6xl mx-auto px-6 py-10">

      <h1 className="text-2xl font-semibold mb-8">
        Create Lead
      </h1>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Farmer Info */}

        <div className="card">

          <h2 className="text-lg font-semibold mb-6">
            Farmer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <label className="label">Farmer Name *</label>
              <input
                name="farmer_name"
                value={form.farmer_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Phone Number *</label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Farmer Type</label>
              <select
                name="farmer_type"
                value={form.farmer_type}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>

          </div>

        </div>

        {/* Location */}

        <div className="card">

          <h2 className="text-lg font-semibold mb-6">
            Location Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <input name="village" placeholder="Village" value={form.village} onChange={handleChange} className="input"/>
            <input name="taluka" placeholder="Taluka" value={form.taluka} onChange={handleChange} className="input"/>
            <input name="district" placeholder="District" value={form.district} onChange={handleChange} className="input"/>
            <input name="state" placeholder="State" value={form.state} onChange={handleChange} className="input"/>

          </div>

        </div>

        {/* Farming */}

        <div className="card">

          <h2 className="text-lg font-semibold mb-6">
            Farming Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <input name="bull_centre" placeholder="Bull Centre" value={form.bull_centre} onChange={handleChange} className="input"/>
            <input name="crop_type" placeholder="Crop Type" value={form.crop_type} onChange={handleChange} className="input"/>

            <input type="number" name="acreage" placeholder="Acreage" value={form.acreage} onChange={handleChange} className="input"/>
            <input type="number" name="total_land_bigha" placeholder="Total Land (Bigha)" value={form.total_land_bigha} onChange={handleChange} className="input"/>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="interested_in_warehouse" checked={form.interested_in_warehouse} onChange={handleChange}/>
              Interested in Warehouse
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="previous_experience" checked={form.previous_experience} onChange={handleChange}/>
              Has Previous Farming Experience
            </label>

          </div>

        </div>

        <div className="flex justify-end">

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Creating..." : "Create Lead"}
          </button>

        </div>

      </form>

    </div>
  )
}