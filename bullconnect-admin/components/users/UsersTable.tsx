"use client"

import { useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { MoreVertical } from "lucide-react"

import { useDeleteUser } from "@/hooks/useDeleteUser"
import { useDeactivateUser } from "@/hooks/useUpdateUserStatus"
import { useResetPassword } from "@/hooks/useResetPassword"

// import { api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

import { toast } from "sonner"

import EditUserDialog from "./EditUserDialog"

type User = {
    id: string
    name: string
    username: string
    phone: string
    role: string
    is_active: boolean
}

export default function UsersTable({ users }: { users: User[] }) {

    const deleteUser = useDeleteUser()
    const deactivateUser = useDeactivateUser()
    const resetPassword = useResetPassword()

    const queryClient = useQueryClient()

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
    }

    function roleColor(role: string) {

        switch (role) {

            case "TELECALLER":
                return "bg-purple-100 text-purple-700"

            case "FIELD_MANAGER":
                return "bg-green-100 text-green-700"

            case "FIELD_EXEC":
                return "bg-orange-100 text-orange-700"

            case "MANAGER":
                return "bg-blue-100 text-blue-700"

            case "ADMIN":
                return "bg-red-100 text-red-700"

            default:
                return ""

        }

    }

    /* ACTIVATE USER */
    async function handleActivate(user: User) {

        deactivateUser.mutate(
            {
                id: user.id,
                is_active: true
            },
            {
                onSuccess: () => toast.success(`${user.name} activated`),
                onError: () => toast.error("Failed to activate user")
            }
        )

    }

    /* DEACTIVATE USER */
    function handleDeactivate(user: User) {

        deactivateUser.mutate(
            {
                id: user.id,
                is_active: false
            },
            {
                onSuccess: () => {
                    toast.success(`${user.name} deactivated`)
                },
                onError: () => {
                    toast.error("Failed to deactivate user")
                }
            }
        )

    }

    /* DELETE USER */
    function handleDelete(user: User) {

        if (!confirm(`Delete ${user.name}?`)) return

        deleteUser.mutate(user.id, {

            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["users"] })
                toast.success(`${user.name} deleted`)
            },

            onError: () => toast.error("Delete failed")

        })

    }

    /* RESET PASSWORD */
    function handleResetPassword(user: User) {

        const newPassword = prompt("Enter new password")

        if (!newPassword) return

        resetPassword.mutate(
            {
                id: user.id,
                newPassword,
            },
            {
                onSuccess: () => toast.success("Password reset successfully"),
                onError: () => toast.error("Password reset failed")
            }
        )

    }

    /* OPEN EDIT DIALOG */
    function handleEdit(user: User) {
        setSelectedUser(user)
        setEditOpen(true)
    }

    return (

        <>

            <div className="border rounded-xl bg-card">

                <table className="w-full text-sm">

                    <thead className="bg-muted">

                        <tr className="text-left">

                            <th className="p-3">User</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 w-[60px]"></th>

                        </tr>

                    </thead>

                    <tbody>

                        {users?.map((user) => (

                            <tr
                                key={user.id}
                                className="border-t hover:bg-muted/40 transition"
                            >

                                <td className="p-3 flex items-center gap-3">

                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="font-medium">
                                        {user.name}
                                    </div>

                                </td>

                                <td className="p-3 text-muted-foreground">
                                    {user.username}
                                </td>

                                <td className="p-3">
                                    {user.phone}
                                </td>

                                <td className="p-3">

                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${roleColor(user.role)}`}
                                    >
                                        {user.role}
                                    </span>

                                </td>

                                <td className="p-3">

                                    {user.is_active ? (

                                        <Badge
                                            variant="outline"
                                            className="text-green-600 border-green-300"
                                        >
                                            Active
                                        </Badge>

                                    ) : (

                                        <Badge
                                            variant="outline"
                                            className="text-red-600 border-red-300"
                                        >
                                            Inactive
                                        </Badge>

                                    )}

                                </td>

                                <td className="p-3">

                                    <DropdownMenu>

                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 rounded hover:bg-muted">
                                                <MoreVertical size={16} />
                                            </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                            className="bg-white/90 backdrop-blur-sm border shadow-lg"
                                        >

                                            <DropdownMenuItem
                                                onClick={() => handleEdit(user)}
                                            >
                                                Edit User
                                            </DropdownMenuItem>

                                            {user.is_active ? (

                                                <DropdownMenuItem
                                                    onClick={() => handleDeactivate(user)}
                                                    className="cursor-pointer text-orange-600"
                                                >
                                                    Deactivate
                                                </DropdownMenuItem>

                                            ) : (

                                                <DropdownMenuItem
                                                    onClick={() => handleActivate(user)}
                                                    className="cursor-pointer text-green-600"
                                                >
                                                    Activate
                                                </DropdownMenuItem>

                                            )}

                                            <DropdownMenuItem
                                                onClick={() => handleResetPassword(user)}
                                            >
                                                Reset Password
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDelete(user)}
                                            >
                                                Delete
                                            </DropdownMenuItem>

                                        </DropdownMenuContent>

                                    </DropdownMenu>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            <EditUserDialog
                user={selectedUser}
                open={editOpen}
                setOpen={setEditOpen}
            />

        </>

    )
}