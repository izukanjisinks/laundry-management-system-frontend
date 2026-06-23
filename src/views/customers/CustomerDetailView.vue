<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import DataTable from '@/components/layout/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Customer, Order, OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])
const loading = ref(true)

const statusColors: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  washing: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  picked_up: 'bg-gray-100 text-gray-800',
}

const orderColumns = [
  { key: 'id', label: 'ID', render: (r: Order) => r.id.slice(0, 8) + '…' },
  { key: 'status', label: 'Status' },
  { key: 'total_price', label: 'Total', render: (r: Order) => `K${Number(r.total_price).toFixed(2)}` },
  { key: 'received_at', label: 'Date', render: (r: Order) => new Date(r.received_at).toLocaleDateString() },
]

onMounted(async () => {
  try {
    const id = route.params.id as string
    const [custRes, ordersRes] = await Promise.all([
      customersApi.get(id),
      customersApi.orders(id),
    ])
    customer.value = custRes.data.data
    orders.value = (ordersRes.data as any).data ?? []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Customer Detail">
      <Button variant="outline" size="sm" @click="router.back()">Back</Button>
    </SiteHeader>
    <div v-if="loading" class="p-6 text-sm text-muted-foreground">Loading…</div>
    <div v-else-if="customer" class="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card>
        <CardHeader><CardTitle class="text-sm">Profile</CardTitle></CardHeader>
        <CardContent class="space-y-1 text-sm">
          <p><span class="text-muted-foreground">Name:</span> <span class="font-medium">{{ customer.name }}</span></p>
          <p><span class="text-muted-foreground">Phone:</span> {{ customer.phone }}</p>
          <p v-if="customer.address"><span class="text-muted-foreground">Address:</span> {{ customer.address }}</p>
          <p v-if="customer.notes"><span class="text-muted-foreground">Notes:</span> {{ customer.notes }}</p>
        </CardContent>
      </Card>
      <h3 class="px-1 text-sm font-semibold">Order History</h3>
      <DataTable :columns="orderColumns" :rows="orders">
        <template #cell-status="{ value }">
          <Badge :class="statusColors[value as OrderStatus]" variant="outline">{{ value }}</Badge>
        </template>
        <template #cell-id="{ row }">
          <button class="font-mono text-xs hover:underline" @click="router.push(`/orders/${row.id}`)">
            {{ row.id.slice(0, 8) }}…
          </button>
        </template>
      </DataTable>
    </div>
  </div>
</template>
