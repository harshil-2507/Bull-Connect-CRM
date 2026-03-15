"use client"

import { useState, useEffect } from "react"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter,
DialogOverlay,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"

import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

type User = {
id: string
name: string
phone: string
role: string
is_active: boolean
}

type Props = {
user: User | null
open: boolean
setOpen: (open: boolean) => void
}

export default function EditUserDialog({
user,
open,
setOpen,
}: Props) {

const queryClient = useQueryClient()

const [form, setForm] = useState({
name: "",
phone: "",
role: "",
is_active: true,
})

useEffect(() => {

if (user) {
setForm({
name: user.name || "",
phone: user.phone || "",
role: user.role || "",
is_active: user.is_active ?? true,
})
}

}, [user])

async function handleSave() {

if (!user) return

try {

await api.put(`/admin/users/${user.id}`, {
name: form.name,
phone: form.phone,
role: form.role,        // ✅ role now sent to backend
is_active: form.is_active,
})

queryClient.invalidateQueries({
queryKey: ["users"],
})

toast.success(`${form.name} updated`)

setOpen(false)

} catch {

toast.error("Update failed")

}

}

if (!user) return null

return (
<Dialog open={open} onOpenChange={setOpen}>

{/* Overlay */}
<DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm"/>

{/* Modal */}
<DialogContent className="sm:max-w-[460px] rounded-xl shadow-xl border bg-white p-6">

<DialogHeader className="mb-4">
<DialogTitle className="text-lg font-semibold">
Edit User
</DialogTitle>
</DialogHeader>

{/* FORM */}
<div className="space-y-4">

{/* NAME */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Full Name
</label>

<Input
value={form.name}
className="w-full"
onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
setForm({ ...form, name: e.target.value })
}
/>
</div>

{/* PHONE */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Phone Number
</label>

<Input
value={form.phone}
className="w-full"
onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
setForm({ ...form, phone: e.target.value })
}
/>
</div>

{/* ROLE */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Role
</label>

<Select
value={form.role}
onValueChange={(value: string) =>
setForm({ ...form, role: value })
}
>

<SelectTrigger className="w-full">
<SelectValue placeholder="Select role"/>
</SelectTrigger>

<SelectContent
  position="popper"
  className="
    z-[100]
    min-w-[200px]
    bg-white/10
    backdrop-blur-md
    border
    shadow-xl
  "
>

<SelectItem value="MANAGER">
Manager
</SelectItem>

<SelectItem value="TELECALLER">
Telecaller
</SelectItem>

<SelectItem value="FIELD_MANAGER">
Field Manager
</SelectItem>

<SelectItem value="FIELD_EXEC">
Field Executive
</SelectItem>

</SelectContent>

</Select>
</div>

{/* STATUS */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Status
</label>

<Select
value={form.is_active ? "active" : "inactive"}
onValueChange={(value: string) =>
setForm({
...form,
is_active: value === "active",
})
}
>

<SelectTrigger className="w-full">
<SelectValue/>
</SelectTrigger>

<SelectContent
  position="popper"
  className="
    z-[100]
    bg-white/10
    backdrop-blur-md
    border
    shadow-xl
  "
>

<SelectItem value="active">
Active
</SelectItem>

<SelectItem value="inactive">
Inactive
</SelectItem>

</SelectContent>

</Select>
</div>

</div>

{/* FOOTER */}
<DialogFooter className="mt-6 flex justify-end gap-2">

<Button
variant="outline"
onClick={() => setOpen(false)}
>
Cancel
</Button>

<Button onClick={handleSave}>
Save Changes
</Button>

</DialogFooter>

</DialogContent>

</Dialog>
)
}