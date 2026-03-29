export interface Telecaller {
  id: string
  name: string
  username?: string
}

export interface Lead {
  id: string
  farmer_name: string
  phone_number: string
  village?: string
  district?: string
  state?: string
}

export interface AssignmentPayload {
  leadId: string
  userId: string
}

export interface Assignment {
  id: string
  lead_id: string
  user_id: string
  assigned_by?: string
  assigned_at: string

  // NEW (from backend)
  lead_name?: string
  lead_phone?: string
  lead_status?: string
  telecaller_name?: string

  // FALLBACK (optional safety)
  farmer_name?: string
  phone_number?: string
}