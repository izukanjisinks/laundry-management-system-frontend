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
  email?: string
  address?: string
  notes?: string
  total_orders?: number
  created_at: string
  updated_at: string
}

export type OrderStatus = 'received' | 'washing' | 'ready' | 'picked_up'
export type ServiceType = 'wash_fold' | 'dry_clean' | 'ironing' | 'wash_iron'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type PaymentMethod = 'cash' | 'card' | 'transfer'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  order_number: number
  customer_id: string
  customer?: Customer
  created_by: string
  status: OrderStatus
  service_type: ServiceType
  items: OrderItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_price: number
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  notes?: string
  due_at?: string
  received_at: string
  updated_at: string
  picked_up_at?: string
}

export interface CatalogItem {
  id: string
  name: string
  slug: string
  base_price: number
  is_active: boolean
  sort_order: number
}

export interface DailyCount {
  day: string
  count: number
}

export interface ReportSummary {
  orders_by_status: Record<OrderStatus, number>
  today_revenue: number
  total_orders: number
  unpaid_orders: number
  daily_orders: DailyCount[]
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
