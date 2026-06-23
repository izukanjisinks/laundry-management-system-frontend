import client from './client'
import type { ApiResponse, User } from '@/types'

export const usersApi = {
  list: () => client.get<ApiResponse<User[]>>('/users'),
  create: (data: Partial<User> & { password: string }) =>
    client.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) => client.put<ApiResponse<User>>(`/users/${id}`, data),
  remove: (id: string) => client.delete<ApiResponse<null>>(`/users/${id}`),
}
