<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportsApi } from '@/api/reports'
import SectionCards from '@/components/layout/SectionCards.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { ReportSummary } from '@/types'

const summary = ref<ReportSummary | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await reportsApi.summary()
    summary.value = data.data
  } finally {
    loading.value = false
  }
})

const statusLabels: Record<string, string> = {
  received: 'Received',
  washing: 'Washing',
  done: 'Done',
  picked_up: 'Picked Up',
}

function cards() {
  if (!summary.value) return []
  const s = summary.value
  return [
    {
      title: "Today's Revenue",
      value: `K${s.todays_revenue.toFixed(2)}`,
      description: `${s.total_orders_today} orders today`,
    },
    ...Object.entries(s.orders_by_status).map(([status, count]) => ({
      title: statusLabels[status] ?? status,
      value: count,
      description: 'orders',
    })),
  ]
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Dashboard" />
    <div class="flex flex-1 flex-col gap-4 py-4 @container/main">
      <div v-if="loading" class="px-4 text-muted-foreground text-sm lg:px-6">Loading…</div>
      <SectionCards v-else :cards="cards()" />
    </div>
  </div>
</template>
