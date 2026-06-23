<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import DataTable from '@/components/layout/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Order, OrderStatus } from '@/types'
import { Plus } from '@lucide/vue'

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(true)

const statusFilter = ref<OrderStatus | ''>('')

const columns = [
  { key: 'id', label: 'ID', sortable: false, render: (r: Order) => r.id.slice(0, 8) + 'â€¦' },
  { key: 'customer', label: 'Customer', sortable: true, render: (r: Order) => r.customer?.name ?? 'â€”' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'total_price', label: 'Total', sortable: true, render: (r: Order) => `K${Number(r.total_price).toFixed(2)}` },
  { key: 'received_at', label: 'Received', sortable: true, render: (r: Order) => new Date(r.received_at).toLocaleDateString() },
]

const statusColors: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  washing: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  picked_up: 'bg-gray-100 text-gray-800',
}

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await ordersApi.list(statusFilter.value || undefined)
    orders.value = data.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Orders">
      <Button size="sm" @click="router.push('/orders/new')">
        <Plus class="mr-1 size-4" /> New Order
      </Button>
    </SiteHeader>
    <div class="flex flex-1 flex-col gap-4 py-4">
      <div v-if="loading" class="px-4 text-sm text-muted-foreground lg:px-6">Loadingâ€¦</div>
      <DataTable v-else :columns="columns" :rows="orders" caption="All laundry orders">
        <template #cell-status="{ value }">
          <Badge :class="statusColors[value as OrderStatus]" variant="outline">
            {{ value }}
          </Badge>
        </template>
        <template #cell-id="{ row }">
          <button
            class="font-mono text-xs underline-offset-2 hover:underline"
            @click="router.push(`/orders/${row.id}`)"
          >
            {{ row.id.slice(0, 8) }}â€¦
          </button>
        </template>
      </DataTable>
    </div>
  </div>
</template>

