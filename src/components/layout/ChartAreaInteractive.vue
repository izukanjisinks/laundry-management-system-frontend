<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChartContainer } from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataPoint {
  date: string
  orders: number
  revenue: number
}

const props = defineProps<{ data: DataPoint[] }>()

const timeRange = ref('90d')

const filteredData = computed(() => {
  const now = new Date()
  const days = timeRange.value === '90d' ? 90 : timeRange.value === '30d' ? 30 : 7
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return props.data.filter((d) => new Date(d.date) >= cutoff)
})

const chartConfig = {
  orders: { label: 'Orders', color: 'var(--color-chart-1)' },
  revenue: { label: 'Revenue', color: 'var(--color-chart-2)' },
}
</script>

<template>
  <Card class="@container/card">
    <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
      <div class="grid flex-1 gap-1 text-center sm:text-left">
        <CardTitle>Orders Over Time</CardTitle>
        <CardDescription>
          Showing orders for the selected period
        </CardDescription>
      </div>
      <Select v-model="timeRange">
        <SelectTrigger class="w-40 rounded-lg sm:ml-auto" aria-label="Select period">
          <SelectValue placeholder="Last 3 months" />
        </SelectTrigger>
        <SelectContent class="rounded-xl">
          <SelectItem value="90d" class="rounded-lg">Last 3 months</SelectItem>
          <SelectItem value="30d" class="rounded-lg">Last 30 days</SelectItem>
          <SelectItem value="7d" class="rounded-lg">Last 7 days</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>
    <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6">
      <ChartContainer :config="chartConfig" class="aspect-auto h-62.5 w-full">
        <slot :data="filteredData" :config="chartConfig" />
      </ChartContainer>
    </CardContent>
  </Card>
</template>
