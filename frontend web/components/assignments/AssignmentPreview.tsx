"use client"

interface Props {
  distribution: Record<string, number>
  totalLeads: number
}

export default function AssignmentPreview({
  distribution,
  totalLeads
}: Props) {

  const totalAssigned = Object.values(distribution)
    .reduce((a, b) => a + b, 0)

  return (
    <div className="border rounded-lg p-3 mt-3 space-y-2">
      <div className="text-sm font-semibold">
        Preview
      </div>

      <div className="text-xs text-gray-500">
        Total Leads: {totalLeads}
      </div>

      {Object.entries(distribution).map(([userId, count]) => (
        <div key={userId} className="text-sm">
          {userId} → {count}
        </div>
      ))}

      <div className="text-xs text-gray-400">
        Assigned: {totalAssigned}
      </div>
    </div>
  )
}