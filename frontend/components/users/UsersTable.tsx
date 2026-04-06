"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit3, Lock, UserX, UserCheck, Trash2 } from "lucide-react"
import { useDeleteUser } from "@/hooks/useDeleteUser"
import { useDeactivateUser } from "@/hooks/useUpdateUserStatus"
import { useResetPassword } from "@/hooks/useResetPassword"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import EditUserDialog from "./EditUserDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
        return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    }

    async function handleActivate(user: User) {
        deactivateUser.mutate(
            { id: user.id, is_active: true },
            {
                onSuccess: () => toast.success(`${user.name} activated`),
                onError: () => toast.error("Failed to activate user")
            }
        )
    }

    function handleDeactivate(user: User) {
        deactivateUser.mutate(
            { id: user.id, is_active: false },
            {
                onSuccess: () => toast.success(`${user.name} deactivated`),
                onError: () => toast.error("Failed to deactivate user")
            }
        )
    }

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

    function handleResetPassword(user: User) {
        const newPassword = prompt("Enter new password")
        if (!newPassword) return
        resetPassword.mutate(
            { id: user.id, newPassword },
            {
                onSuccess: () => toast.success("Password reset successfully"),
                onError: () => toast.error("Password reset failed")
            }
        )
    }

    function handleEdit(user: User) {
        setSelectedUser(user)
        setEditOpen(true)
    }

    return (
        <>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">User Details</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Username</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Phone</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Role</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8">Status</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-6 px-8 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                    <TableCell className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                                                <AvatarFallback className="bg-slate-900 text-white font-bold text-[10px]">{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{user.name}</span>
                                                <span className="text-[11px] font-medium text-slate-400">{user.username}@harvest.io</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 px-8 text-sm font-medium text-slate-600">{user.username}</TableCell>
                                    <TableCell className="py-6 px-8 text-sm font-medium text-slate-600">{user.phone}</TableCell>
                                    <TableCell className="py-6 px-8">
                                        <StatusBadge status={user.role} className="rounded-lg px-3 py-1" />
                                    </TableCell>
                                    <TableCell className="py-6 px-8">
                                        {user.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">Active</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">Inactive</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-6 px-8 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl shadow-xl border border-slate-100 bg-white z-[100]">
                                                <DropdownMenuItem onClick={() => handleEdit(user)} className="gap-3 py-3 rounded-xl cursor-pointer">
                                                    <Edit3 size={16} className="text-slate-400" />
                                                    <span className="font-medium">Edit User</span>
                                                </DropdownMenuItem>
                                                {user.is_active ? (
                                                    <DropdownMenuItem onClick={() => handleDeactivate(user)} className="gap-3 py-3 rounded-xl cursor-pointer text-orange-600 hover:bg-orange-50">
                                                        <UserX size={16} />
                                                        <span className="font-medium">Deactivate</span>
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleActivate(user)} className="gap-3 py-3 rounded-xl cursor-pointer text-green-600 hover:bg-green-50">
                                                        <UserCheck size={16} />
                                                        <span className="font-medium">Activate</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleResetPassword(user)} className="gap-3 py-3 rounded-xl cursor-pointer">
                                                    <Lock size={16} className="text-slate-400" />
                                                    <span className="font-medium">Reset Password</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(user)} className="gap-3 py-3 rounded-xl cursor-pointer text-red-600 hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                    <span className="font-medium">Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditUserDialog
                user={selectedUser}
                open={editOpen}
                setOpen={setEditOpen}
            />
        </>
    )
}