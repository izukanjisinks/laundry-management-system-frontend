import client from './client'
import type { ApiResponse, AuthTokens, LoginRequest } from '@/types'

export const authApi = {
  login: (payload: LoginRequest) =>
    client.post<ApiResponse<AuthTokens>>('/auth/login', payload),
}
