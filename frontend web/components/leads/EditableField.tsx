"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

type Props = {
  label: string
  value: any
  field: string
  onSave: (field: string, value: any) => void
}

export default function EditableField({
  label,
  value,
  field,
  onSave
}: Props) {

  const [editing,setEditing] = useState(false)
  const [val,setVal] = useState(value ?? "")

  const save = () => {

    if(val === value){
      setEditing(false)
      return
    }

    onSave(field,val)

    setEditing(false)

  }

  return (

    <div>

      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      {editing ? (

        <div className="flex gap-2 items-center">

          <input
            value={val}
            onChange={(e)=>setVal(e.target.value)}
            className="border px-2 py-1 rounded w-full text-sm"
          />

          <button
            onClick={save}
            className="text-blue-600 text-sm"
          >
            Save
          </button>

        </div>

      ) : (

        <div className="flex items-center gap-2">

          <p className="font-medium text-sm">
            {value ?? "-"}
          </p>

          <button
            onClick={()=>setEditing(true)}
            className="text-muted-foreground hover:text-black"
          >
            <Pencil size={14}/>
          </button>

        </div>

      )}

    </div>

  )

}