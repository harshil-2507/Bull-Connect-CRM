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
  assigned_by: string
  assigned_at: string
  telecaller_name?: string
}