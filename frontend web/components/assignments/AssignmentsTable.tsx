"use client"

import { useAssignments } from "@/hooks/useAssignments"

export default function AssignmentsTable() {

  const { data } = useAssignments()

  const assignments = data || []

  return (

    <div className="border rounded-lg">

      <table className="w-full text-sm">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Lead</th>
            <th className="p-2 text-left">Telecaller</th>
            <th className="p-2 text-left">Assigned At</th>
          </tr>
        </thead>

        <tbody>

          {assignments.map((a) => (

            <tr key={a.id} className="border-t">

              <td className="p-2">{a.lead_id}</td>
              <td className="p-2">{a.telecaller_name}</td>
              <td className="p-2">
                {new Date(a.assigned_at).toLocaleString()}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}