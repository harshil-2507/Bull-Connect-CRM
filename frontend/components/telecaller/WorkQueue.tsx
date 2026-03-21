// frontend/components/telecaller/WorkQueue.tsx

"use client"

import LeadCard from "./LeadCard"

export default function WorkQueue({ data, onCall }: any) {

  return (
    <div className="space-y-4">

      {data?.map((lead: any) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onCall={onCall}
        />
      ))}

    </div>
  )
}