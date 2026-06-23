import client from './client'
import type { ApiResponse, ReportSummary } from '@/types'

export const reportsApi = {
  summary: () => client.get<ApiResponse<ReportSummary>>('/reports/summary'),
}
