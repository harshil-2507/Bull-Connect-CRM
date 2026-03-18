"use client"

import {
Users,
UserCheck,
PhoneCall,
Briefcase,
Truck,
CheckCircle
} from "lucide-react"

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
icon={<Users size={18}/>}
gradient="from-blue-50 via-blue-100 to-blue-50"
accent="bg-blue-500"
number="text-blue-700"
/>

<StatCard
title="Managers"
value={managers}
icon={<UserCheck size={18}/>}
gradient="from-indigo-50 via-indigo-100 to-indigo-50"
accent="bg-indigo-500"
number="text-indigo-700"
/>

<StatCard
title="Telecallers"
value={telecallers}
icon={<PhoneCall size={18}/>}
gradient="from-violet-50 via-violet-100 to-violet-50"
accent="bg-violet-500"
number="text-violet-700"
/>

<StatCard
title="Field Managers"
value={fieldManagers}
icon={<Briefcase size={18}/>}
gradient="from-emerald-50 via-emerald-100 to-emerald-50"
accent="bg-emerald-500"
number="text-emerald-700"
/>

<StatCard
title="Field Execs"
value={fieldExecs}
icon={<Truck size={18}/>}
gradient="from-amber-50 via-amber-100 to-amber-50"
accent="bg-amber-500"
number="text-amber-700"
/>

<StatCard
title="Active Users"
value={active}
icon={<CheckCircle size={18}/>}
gradient="from-teal-50 via-teal-100 to-teal-50"
accent="bg-teal-500"
number="text-teal-700"
/>

</div>

)
}

function StatCard({
title,
value,
icon,
gradient,
accent,
number
}:{
title:string
value:number
icon:React.ReactNode
gradient:string
accent:string
number:string
}){

return(

<div className={`relative bg-gradient-to-br ${gradient} border border-black/5 rounded-xl p-4 shadow-sm hover:shadow-md transition`}>

{/* top accent line */}

<div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl ${accent}`}/>

{/* header */}

<div className="flex items-center justify-between mb-2">

<p className="text-xs text-muted-foreground">
{title}
</p>

<div className="opacity-70">
{icon}
</div>

</div>

{/* number */}

<p className={`text-2xl font-semibold ${number}`}>
{value}
</p>

</div>

)
}