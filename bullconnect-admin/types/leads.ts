export interface Lead {
  id: string

  farmer_name: string
  phone_number: string

  farmer_type?: string

  village?: string
  taluka?: string
  district?: string
  state?: string

  bull_centre?: string
  crop_type?: string

  acreage?: number
  total_land_bigha?: number

  interested_in_warehouse?: boolean
  previous_experience?: boolean

  status: string
  created_at: string
}