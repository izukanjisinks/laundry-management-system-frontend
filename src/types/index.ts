export interface Role {
  id: string
  name: 'admin' | 'staff'
  description?: string
}

export interface User {
  id: string
  full_name: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
  last_login_at?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 'received' | 'washing' | 'done' | 'picked_up'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customer_id: string
  customer?: Customer
  created_by: string
  status: OrderStatus
  items: OrderItem[]
  total_price: number
  notes?: string
  received_at: string
  updated_at: string
  picked_up_at?: string
}

export interface ReportSummary {
  orders_by_status: Record<OrderStatus, number>
  todays_revenue: number
  total_orders_today: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  token: string
  user: User
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
