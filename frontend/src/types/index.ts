export type Role = "ADMIN" | "MANAGER" | "TELECALLER" | "FIELD_MANAGER" | "FIELD_EXEC";

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface ApiError {
  error: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  mobile_number: string;
  role: Exclude<Role, "ADMIN">;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_by: number;
  created_at: string;
  total_leads?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  taluka: string | null;
  district: string | null;
  geo_state: string | null;
  campaign_id: number;
  lead_status: string;
  created_at: string;
}
