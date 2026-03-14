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




    alternate_phone?: string
    farmer_id?: string
    source?: string
    product_type?: string
    experience_or_remarks?: string

    castor_bori?: number
    castor_expected_price?: number
    castor_offered_price?: number
    castor_expected_harvest_time?: string
    castor_vavetar_bigha?: number
    castor_deal_status?: string
    castor_intent_to_sell?: string

    groundnut_bori?: number
    groundnut_expected_price?: number
    groundnut_offered_price?: number
    groundnut_expected_harvest_time?: string
    groundnut_vavetar_bigha?: number
    groundnut_intent_to_sell?: string
}