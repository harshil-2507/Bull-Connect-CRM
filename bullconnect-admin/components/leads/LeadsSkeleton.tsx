export default function LeadsSkeleton() {

  const rows = Array.from({ length: 10 })

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm mt-4">

      <div className="divide-y">

        {rows.map((_, i) => (

          <div
            key={i}
            className="h-12 bg-muted animate-pulse"
          />

        ))}

      </div>

    </div>
  )
}