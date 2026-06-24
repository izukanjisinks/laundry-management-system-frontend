import client from './client'
import type { ApiResponse, CatalogItem } from '@/types'

export const catalogApi = {
  list: () => client.get<ApiResponse<CatalogItem[]>>('/catalog'),
}
