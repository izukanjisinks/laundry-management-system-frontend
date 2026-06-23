import client from './client'
import type { ApiResponse, Customer } from '@/types'

export const customersApi = {
  list: () => client.get<ApiResponse<Customer[]>>('/customers'),
  get: (id: string) => client.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Partial<Customer>) => client.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<Customer>) =>
    client.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  orders: (id: string) => client.get(`/customers/${id}/orders`),
}
