import client from './client'
import type { ApiResponse, Order, OrderStatus } from '@/types'

export const ordersApi = {
  list: (status?: OrderStatus) =>
    client.get<ApiResponse<Order[]>>('/orders', { params: status ? { status } : undefined }),
  get: (id: string) => client.get<ApiResponse<Order>>(`/orders/${id}`),
  create: (data: Partial<Order>) => client.post<ApiResponse<Order>>('/orders', data),
  update: (id: string, data: Partial<Order>) =>
    client.put<ApiResponse<Order>>(`/orders/${id}`, data),
  updateStatus: (id: string, status: OrderStatus) =>
    client.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
}
