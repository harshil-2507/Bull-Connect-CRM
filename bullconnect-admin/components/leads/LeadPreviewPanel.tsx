"use client"

import { Lead } from "@/types/leads"
import { X, Phone, MessageSquare, Calendar } from "lucide-react"

import StatusBadge from "./StatusBadge"
import ActivityTimeline from "./ActivityTimeline"
import EditableField from "./EditableField"

import { useUpdateLead } from "@/hooks/useUpdateLead"
import { useLead } from "@/hooks/useLead"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

type Props = {
    lead: Lead
    onClose: () => void
}

function CollapsibleSection({
    title,
    children,
    color
}: {
    title: string
    children: React.ReactNode
    color: string
}) {

    const [open, setOpen] = useState(true)

    return (

        <div
            className={`
      relative rounded-xl border ${color}
      bg-white/80 backdrop-blur-md
      shadow-sm hover:shadow-md
      transition p-4
      overflow-hidden
      `}
        >

            {/* gradient overlay */}

            <div
                className="absolute inset-0 bg-gradient-to-br from-white via-white/40 to-transparent opacity-60"
            />

            <button
                onClick={() => setOpen(!open)}
                className="relative flex justify-between w-full items-center mb-3"
            >

                <h3 className="text-[13px] font-semibold tracking-wide">
                    {title}
                </h3>

                <span className="text-xs text-muted-foreground">
                    {open ? "−" : "+"}
                </span>

            </button>

            {open && (

                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className="relative grid grid-cols-2 gap-4"
                >

                    {children}

                </motion.div>

            )}

        </div>

    )

}

export default function LeadPreviewPanel({ lead, onClose }: Props) {

    const { data } = useLead(lead.id)
    const currentLead = data || lead

    const updateLead = useUpdateLead(lead.id)

    const handleSave = (field: string, value: any) => {

        updateLead.mutate({
            [field]: value
        })

    }

    /* keyboard shortcuts */

    useEffect(() => {

        const handler = (e: KeyboardEvent) => {

            if (e.key === "c") alert("Call action")
            if (e.key === "n") alert("Add note")
            if (e.key === "v") alert("Schedule visit")

        }

        window.addEventListener("keydown", handler)

        return () => window.removeEventListener("keydown", handler)

    }, [])

    return (

        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 flex justify-end"
        >

            <motion.div
                initial={{ x: 500 }}
                animate={{ x: 0 }}
                exit={{ x: 500 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[520px] h-full bg-white/70 backdrop-blur-xl shadow-2xl overflow-y-auto"
            >

                <div className="p-6 space-y-6">

                    {/* HEADER */}

                    <div className="sticky top-0 z-10
  bg-white
  border border-gray-200
  rounded-xl
  p-4
  shadow-sm
  mb-4">

                        <div className="flex justify-between items-start">

                            <div className="flex gap-3 items-center">

                                {/* avatar */}

                                <div
                                    className="
                  w-14 h-14 rounded-full
                  bg-gradient-to-br from-blue-500 to-indigo-500
                  text-white flex items-center justify-center
                  font-semibold text-lg shadow-md
                  "
                                >

                                    {currentLead.farmer_name?.charAt(0)}

                                </div>

                                <div>

                                    <h2 className="text-xl font-semibold">
                                        {currentLead.farmer_name}
                                    </h2>

                                    <p className="text-sm text-muted-foreground">
                                        {currentLead.phone_number}
                                    </p>

                                    <div className="mt-1">
                                        <StatusBadge status={currentLead.status} />
                                    </div>

                                </div>

                            </div>

                            <button onClick={onClose}>
                                <X size={18} />
                            </button>

                        </div>

                        <div className="mt-4 border-b border-gray-200" />

                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="flex gap-3">

                        <button
                            className="
              flex items-center gap-2
              px-4 py-2 rounded-md text-sm
              bg-green-500 text-white
              shadow-sm hover:shadow-md
              hover:bg-green-600 transition
              "
                        >

                            <Phone size={15} />
                            Call

                        </button>

                        <button
                            className="
              flex items-center gap-2
              px-4 py-2 rounded-md text-sm
              bg-blue-500 text-white
              shadow-sm hover:shadow-md
              hover:bg-blue-600 transition
              "
                        >

                            <MessageSquare size={15} />
                            Note

                        </button>

                        <button
                            className="
              flex items-center gap-2
              px-4 py-2 rounded-md text-sm
              bg-purple-500 text-white
              shadow-sm hover:shadow-md
              hover:bg-purple-600 transition
              "
                        >

                            <Calendar size={15} />
                            Visit

                        </button>

                    </div>

                    {/* ACTIVITY */}

                    <div>

                        <h3 className="font-semibold text-sm mb-3">
                            Activity
                        </h3>

                        <div
                            className="
              bg-slate-50
              border border-slate-200
              rounded-xl p-4
              "
                        >

                            <ActivityTimeline lead={currentLead} />

                        </div>

                    </div>

                    {/* SECTIONS */}

                    <div className="space-y-5">

                        <CollapsibleSection
                            title="Farmer Information"
                            color="border-blue-300"
                        >

                            <EditableField
                                label="Farmer Type"
                                value={currentLead.farmer_type}
                                field="farmer_type"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Source"
                                value={currentLead.source}
                                field="source"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Product Type"
                                value={currentLead.product_type}
                                field="product_type"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Remarks"
                                value={currentLead.experience_or_remarks}
                                field="experience_or_remarks"
                                onSave={handleSave}
                            />

                        </CollapsibleSection>


                        <CollapsibleSection
                            title="Location"
                            color="border-indigo-300"
                        >

                            <EditableField
                                label="Village"
                                value={currentLead.village}
                                field="village"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Taluka"
                                value={currentLead.taluka}
                                field="taluka"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="District"
                                value={currentLead.district}
                                field="district"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Bull Centre"
                                value={currentLead.bull_centre}
                                field="bull_centre"
                                onSave={handleSave}
                            />

                        </CollapsibleSection>


                        <CollapsibleSection
                            title="Castor Deal"
                            color="border-amber-300"
                        >

                            <EditableField
                                label="Expected Price"
                                value={currentLead.castor_expected_price}
                                field="castor_expected_price"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Offered Price"
                                value={currentLead.castor_offered_price}
                                field="castor_offered_price"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Harvest Time"
                                value={currentLead.castor_expected_harvest_time}
                                field="castor_expected_harvest_time"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Vavetar (Bigha)"
                                value={currentLead.castor_vavetar_bigha}
                                field="castor_vavetar_bigha"
                                onSave={handleSave}
                            />

                        </CollapsibleSection>


                        <CollapsibleSection
                            title="Groundnut Deal"
                            color="border-yellow-300"
                        >

                            <EditableField
                                label="Expected Price"
                                value={currentLead.groundnut_expected_price}
                                field="groundnut_expected_price"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Offered Price"
                                value={currentLead.groundnut_offered_price}
                                field="groundnut_offered_price"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Harvest Time"
                                value={currentLead.groundnut_expected_harvest_time}
                                field="groundnut_expected_harvest_time"
                                onSave={handleSave}
                            />

                            <EditableField
                                label="Vavetar (Bigha)"
                                value={currentLead.groundnut_vavetar_bigha}
                                field="groundnut_vavetar_bigha"
                                onSave={handleSave}
                            />

                        </CollapsibleSection>

                    </div>

                </div>

            </motion.div>

        </div>

    )

}