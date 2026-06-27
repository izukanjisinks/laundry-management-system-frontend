import client from './client'
import type { ApiResponse, Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/types'

export const ordersApi = {
  list: (status?: OrderStatus) =>
    client.get<ApiResponse<Order[]>>('/orders', { params: status ? { status } : undefined }),

  get: (id: string) =>
    client.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: {
    customer_id: string
    service_type: string
    items: { name: string; qty: number; price: number }[]
    notes?: string
    due_at?: string
  }) => client.post<ApiResponse<Order>>('/orders', data),

  update: (id: string, data: Partial<Order>) =>
    client.put<ApiResponse<Order>>(`/orders/${id}`, data),

  updateStatus: (id: string, status: OrderStatus) =>
    client.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),

  updatePayment: (id: string, payment_status: PaymentStatus, payment_method: PaymentMethod) =>
    client.patch<ApiResponse<Order>>(`/orders/${id}/payment`, { payment_status, payment_method }),

  delete: (id: string) =>
    client.delete(`/orders/${id}`),

  notifyReady: (id: string) =>
    client.post<{ message: string }>(`/orders/${id}/notify-ready`),

  exportCsv: (status?: OrderStatus) =>
    client.get('/orders/export', {
      params: status ? { status } : undefined,
      responseType: 'blob',
    }),
}
