import client from './client'
import type { ApiResponse, Role, User } from '@/types'

export const usersApi = {
  list: () => client.get<ApiResponse<User[]>>('/users'),
  listRoles: () => client.get<ApiResponse<Role[]>>('/roles'),
  create: (data: Partial<User> & { password: string; role_id: string }) =>
    client.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: { full_name: string; email: string; role_id: string; is_active: boolean }) =>
    client.put<ApiResponse<User>>(`/users/${id}`, data),
  updatePassword: (id: string, password: string) =>
    client.patch<ApiResponse<null>>(`/users/${id}/password`, { password }),
  remove: (id: string) => client.delete<ApiResponse<null>>(`/users/${id}`),
}
