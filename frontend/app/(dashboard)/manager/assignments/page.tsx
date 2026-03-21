"use client"

import AssignLeadsDialog from "@/components/assignments/AssignLeadsDialog"
import AssignmentsTable from "@/components/assignments/AssignmentsTable"

export default function AssignmentsPage() {

  return (

    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Assignments
          </h1>

          <p className="text-gray-500">
            Manage lead assignments
          </p>
        </div>

        <AssignLeadsDialog />

      </div>

      {/* TABLE */}
      <AssignmentsTable />

    </div>

  )
}