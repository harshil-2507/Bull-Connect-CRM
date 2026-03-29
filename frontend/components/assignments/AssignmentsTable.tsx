"use client"

import { useAssignments } from "@/hooks/useAssignments"

export default function AssignmentsTable() {

  const { data, isLoading, isError } = useAssignments()

  const assignments = data || []

  // 🔍 Top-level debug
  console.log("ALL ASSIGNMENTS:", assignments)

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

          {/* 🔄 Loading */}
          {isLoading && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-gray-500">
                Loading assignments...
              </td>
            </tr>
          )}

          {/* ❌ Error */}
          {isError && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-red-500">
                Failed to load assignments
              </td>
            </tr>
          )}

          {/* 📭 Empty */}
          {!isLoading && assignments.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-gray-500">
                No assignments found
              </td>
            </tr>
          )}

          {/* ✅ Data */}
          {!isLoading && assignments.length > 0 && (
            assignments.map((a) => {

              // 🔍 Row-level debug
              console.log("ROW DATA:", a)

              return (
                <tr
                  key={a.id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* LEAD */}
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {a.lead_name || a.farmer_name || "N/A"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {a.lead_phone || a.phone_number || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* TELECALLER */}
                  <td className="p-3">
                    {a.telecaller_name || "N/A"}
                  </td>

                  {/* DATE */}
                  <td className="p-3">
                    {a.assigned_at
                      ? new Date(a.assigned_at).toLocaleString()
                      : "N/A"}
                  </td>

                </tr>
              )
            })
          )}

        </tbody>

      </table>

    </div>
  )
}