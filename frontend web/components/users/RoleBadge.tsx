export default function RoleBadge({ role }: { role: string }) {

  const colors: any = {
    MANAGER: "bg-blue-100 text-blue-700",
    TELECALLER: "bg-purple-100 text-purple-700",
    FIELD_MANAGER: "bg-green-100 text-green-700",
    FIELD_EXEC: "bg-orange-100 text-orange-700",
  }

  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-medium ${colors[role]}`}
    >
      {role}
    </span>
  )
}