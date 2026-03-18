"use client"

import AssignLeadsDialog from "@/components/assignments/AssignLeadsDialog"
import AssignmentsTable from "@/components/assignments/AssignmentsTable"

export default function AssignmentsPage() {

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Assignments
          </h1>
          <p className="text-muted-foreground">
            Manage lead assignments
          </p>
        </div>

        <AssignLeadsDialog />

      </div>

      <AssignmentsTable />

    </div>

  )
}