import LeadForm from "@/components/leads/LeadForm"

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Lead</h1>
      <LeadForm />
    </div>
  )
}