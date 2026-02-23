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
  phone: string;
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
  farmer_name: string;
  phone_number: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
  campaign_id: number;
  status: string;
  created_at: string;
  campaign_name?: string;
}
