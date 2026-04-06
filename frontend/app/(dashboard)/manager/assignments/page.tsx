"use client"

import AssignLeadsDialog from "@/components/assignments/AssignLeadsDialog"
import AssignmentsTable from "@/components/assignments/AssignmentsTable"

export default function AssignmentsPage() {

  return (

    <div className="min-h-screen bg-[#F9FAFC] px-8 py-10 space-y-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Lead Assignments
          </h1>

          <p className="text-slate-500 mt-1 font-medium italic">
            Assign prospects to growth experts and monitor distribution.
          </p>
        </div>

        <div className="flex gap-3">
          <AssignLeadsDialog />
        </div>

      </div>

      {/* TABLE */}
      <div className="space-y-6 pb-10">
        <h2 className="text-xl font-bold text-slate-900 px-2 tracking-tight">Recent Allocations</h2>
        <AssignmentsTable />
      </div>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-10">
          Bull Connect © 2026. Lead distribution system.
      </div>

    </div>

  )
}