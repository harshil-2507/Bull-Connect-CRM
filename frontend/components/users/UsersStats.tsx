"use client"

import { StatsCard } from "@/components/shared/StatsCard"
import { Users, UserCheck, PhoneCall, Briefcase, Truck, CheckCircle } from "lucide-react"

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatsCard 
                title="Total Users" 
                value={total} 
                icon={Users} 
            />
            <StatsCard 
                title="Managers" 
                value={managers} 
                icon={UserCheck} 
            />
            <StatsCard 
                title="Telecallers" 
                value={telecallers} 
                icon={PhoneCall} 
            />
            <StatsCard 
                title="Field Managers" 
                value={fieldManagers} 
                icon={Briefcase} 
            />
            <StatsCard 
                title="Field Execs" 
                value={fieldExecs} 
                icon={Truck} 
            />
            <StatsCard 
                title="Active Users" 
                value={active} 
                icon={CheckCircle} 
            />
        </div>
    )
}