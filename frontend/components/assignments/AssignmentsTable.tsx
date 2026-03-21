"use client"

import { useAssignments } from "@/hooks/useAssignments"

export default function AssignmentsTable() {

  const { data } = useAssignments()

  const assignments = data || []

  return (

    <div className="border rounded-lg bg-white text-black">

      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="bg-gray-100 text-black">
          <tr>
            <th className="p-3 text-left font-medium">Lead</th>
            <th className="p-3 text-left font-medium">Telecaller</th>
            <th className="p-3 text-left font-medium">Assigned At</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>

          {assignments.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="p-6 text-center text-gray-500"
              >
                No assignments found
              </td>
            </tr>
          ) : (

            assignments.map((a) => (

              <tr
                key={a.id}
                className="border-t hover:bg-gray-50 transition"
              >

                <td className="p-3">
                  {a.lead_id}
                </td>

                <td className="p-3">
                  {a.telecaller_name}
                </td>

                <td className="p-3">
                  {new Date(a.assigned_at).toLocaleString()}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  )
}