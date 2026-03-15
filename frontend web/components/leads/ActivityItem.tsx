"use client"

import { formatDistanceToNow } from "date-fns"
import { Pencil, Phone, MessageSquare, Calendar, User } from "lucide-react"

type Props = {
  type: string
  description: string
  createdAt: string
}

function getIcon(type: string) {

  if (type === "FIELD_UPDATED")
    return <Pencil size={14}/>

  if (type === "CALL_LOGGED")
    return <Phone size={14}/>

  if (type === "NOTE_ADDED")
    return <MessageSquare size={14}/>

  if (type === "VISIT_SCHEDULED")
    return <Calendar size={14}/>

  return <User size={14}/>

}

export default function ActivityItem({
  type,
  description,
  createdAt
}: Props) {

  return (

    <div className="flex gap-3 items-start relative">

      {/* timeline node */}

      <div className="absolute -left-[14px] top-1 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center">

        {getIcon(type)}

      </div>

      <div className="ml-4">

        <p className="text-sm font-medium">
          {description}
        </p>

        <p className="text-xs text-muted-foreground">

          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}

        </p>

      </div>

    </div>

  )

}