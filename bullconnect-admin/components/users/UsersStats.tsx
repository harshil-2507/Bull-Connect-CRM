"use client"

type User = {
  id: string
  name: string
  username: string
  phone: string
  role: string
  is_active: boolean
}

export default function UsersStats({ users }: { users: User[] }) {

  const total = users.length

  const managers = users.filter(u => u.role === "MANAGER").length
  const telecallers = users.filter(u => u.role === "TELECALLER").length
  const fieldManagers = users.filter(u => u.role === "FIELD_MANAGER").length
  const fieldExecs = users.filter(u => u.role === "FIELD_EXEC").length
  const active = users.filter(u => u.is_active).length

  return (

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

      <StatCard
        title="Total Users"
        value={total}
        gradient="from-blue-50 via-blue-100 to-blue-50"
        numberColor="text-blue-700"
      />

      <StatCard
        title="Managers"
        value={managers}
        gradient="from-indigo-50 via-indigo-100 to-indigo-50"
        numberColor="text-indigo-700"
      />

      <StatCard
        title="Telecallers"
        value={telecallers}
        gradient="from-violet-50 via-violet-100 to-violet-50"
        numberColor="text-violet-700"
      />

      <StatCard
        title="Field Managers"
        value={fieldManagers}
        gradient="from-emerald-50 via-emerald-100 to-emerald-50"
        numberColor="text-emerald-700"
      />

      <StatCard
        title="Field Execs"
        value={fieldExecs}
        gradient="from-amber-50 via-amber-100 to-amber-50"
        numberColor="text-amber-700"
      />

      <StatCard
        title="Active Users"
        value={active}
        gradient="from-teal-50 via-teal-100 to-teal-50"
        numberColor="text-teal-700"
      />

    </div>

  )
}

function StatCard({
  title,
  value,
  gradient,
  numberColor
}: {
  title: string
  value: number
  gradient: string
  numberColor: string
}) {

  return (

    <div
      className={`bg-gradient-to-br ${gradient} border border-black/5 rounded-xl p-4 shadow-sm hover:shadow-md transition`}
    >

      <p className="text-xs text-muted-foreground mb-1">
        {title}
      </p>

      <p className={`text-2xl font-semibold ${numberColor}`}>
        {value}
      </p>

    </div>

  )
}