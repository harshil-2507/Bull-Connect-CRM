export default function StatusBadge({ status }: { status: string }) {

  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    CONTACTED: "bg-yellow-100 text-yellow-800",
    VISIT_REQUESTED: "bg-purple-100 text-purple-700",
    VISIT_COMPLETED: "bg-green-100 text-green-700",
    SOLD: "bg-emerald-100 text-emerald-700",
    DROPPED: "bg-red-100 text-red-700",
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  )
}