"use client"

import { useState } from "react"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter,
DialogTrigger,
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

import { api } from "@/lib/api"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"

export default function CreateUserDialog() {

const queryClient = useQueryClient()

const [open, setOpen] = useState(false)

const [form, setForm] = useState({
name: "",
username: "",
phone: "",
password: "",
role: "MANAGER",
})
const [showPassword, setShowPassword] = useState(false)
async function handleCreate() {

try {

await api.post("/admin/users", form)

toast.success("User created successfully")

queryClient.invalidateQueries({
queryKey: ["users"],
})

setForm({
name: "",
username: "",
phone: "",
password: "",
role: "MANAGER",
})

setOpen(false)

} catch {
toast.error("Failed to create user")
}

}

return (

<Dialog open={open} onOpenChange={setOpen}>

<DialogTrigger asChild>
<Button>Create User</Button>
</DialogTrigger>

<DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm"/>

<DialogContent className="sm:max-w-[460px] rounded-xl shadow-xl border bg-white p-6">

<DialogHeader className="mb-4">
<DialogTitle className="text-lg font-semibold">
Create User
</DialogTitle>
</DialogHeader>

<div className="space-y-4">

{/* NAME */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Full Name
</label>

<Input
value={form.name}
onChange={(e) =>
setForm({ ...form, name: e.target.value })
}
/>
</div>

{/* USERNAME */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Username
</label>

<Input
value={form.username}
onChange={(e) =>
setForm({ ...form, username: e.target.value })
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
onChange={(e) =>
setForm({ ...form, phone: e.target.value })
}
/>
</div>


{/* PASSWORD */}
<div className="space-y-1">

<label className="text-sm font-medium text-muted-foreground">
Password
</label>

<div className="relative">

<Input
type={showPassword ? "text" : "password"}
value={form.password}
onChange={(e) =>
setForm({ ...form, password: e.target.value })
}
className="pr-10"
/>

<button
type="button"
onClick={() => setShowPassword(!showPassword)}
className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
>

{showPassword ? (
<EyeOff size={18}/>
) : (
<Eye size={18}/>
)}

</button>

</div>

</div>

{/* ROLE */}
<div className="space-y-1">
<label className="text-sm font-medium text-muted-foreground">
Role
</label>

<Select
value={form.role}
onValueChange={(value) =>
setForm({ ...form, role: value })
}
>

<SelectTrigger>
<SelectValue/>
</SelectTrigger>

<SelectContent position="popper" className="z-50 min-w-[200px]">

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

</div>

<DialogFooter className="mt-6 flex justify-end gap-2">

<Button
variant="outline"
onClick={() => setOpen(false)}
>
Cancel
</Button>

<Button onClick={handleCreate}>
Create User
</Button>

</DialogFooter>

</DialogContent>

</Dialog>

)
}