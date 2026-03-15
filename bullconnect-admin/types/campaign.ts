export interface Campaign {

  id: string
  name: string
  region: string | null
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED"

  start_date: string
  end_date: string

  total_leads: number

  created_at: string

}