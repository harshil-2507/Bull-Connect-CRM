"use client"

import { formatDistanceToNow } from "date-fns"

type Props = {
  type: string
  description: string
  createdAt: string
}

export default function ActivityItem({
  type,
  description,
  createdAt
}: Props) {

  return (

    <div className="flex gap-3">

      <div className="w-2 h-2 mt-2 rounded-full bg-primary" />

      <div>

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