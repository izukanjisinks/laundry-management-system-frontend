<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Order, OrderStatus } from '@/types'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const order = ref<Order | null>(null)
const loading = ref(true)
const updating = ref(false)

const statusFlow: OrderStatus[] = ['received', 'washing', 'done', 'picked_up']

const nextStatus = computed<OrderStatus | null>(() => {
  if (!order.value) return null
  const idx = statusFlow.indexOf(order.value.status)
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null
})

const statusColors: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  washing: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  picked_up: 'bg-gray-100 text-gray-800',
}

onMounted(async () => {
  try {
    const { data } = await ordersApi.get(route.params.id as string)
    order.value = data.data
  } finally {
    loading.value = false
  }
})

async function advanceStatus() {
  if (!order.value || !nextStatus.value) return
  updating.value = true
  try {
    const { data } = await ordersApi.updateStatus(order.value.id, nextStatus.value)
    order.value = data.data
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Order Detail">
      <Button variant="outline" size="sm" @click="router.back()">Back</Button>
    </SiteHeader>
    <div v-if="loading" class="p-6 text-sm text-muted-foreground">Loading…</div>
    <div v-else-if="order" class="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Order {{ order.id.slice(0, 8) }}…</h2>
        <Badge :class="statusColors[order.status]" variant="outline">{{ order.status }}</Badge>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle class="text-sm">Customer</CardTitle></CardHeader>
          <CardContent>
            <p class="font-medium">{{ order.customer?.name ?? '—' }}</p>
            <p class="text-sm text-muted-foreground">{{ order.customer?.phone }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle class="text-sm">Summary</CardTitle></CardHeader>
          <CardContent class="space-y-1 text-sm">
            <p>Total: <span class="font-semibold">K{{ Number(order.total_price).toFixed(2) }}</span></p>
            <p>Received: {{ new Date(order.received_at).toLocaleString() }}</p>
            <p v-if="order.picked_up_at">Picked up: {{ new Date(order.picked_up_at).toLocaleString() }}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle class="text-sm">Items</CardTitle></CardHeader>
        <CardContent>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-muted-foreground">
                <th class="pb-2 text-left">Item</th>
                <th class="pb-2 text-right">Qty</th>
                <th class="pb-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.name" class="border-b last:border-0">
                <td class="py-2">{{ item.name }}</td>
                <td class="py-2 text-right">{{ item.qty }}</td>
                <td class="py-2 text-right">K{{ Number(item.price).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div v-if="nextStatus && auth.isAdmin" class="flex gap-2">
        <Button @click="advanceStatus" :disabled="updating">
          {{ updating ? 'Updating…' : `Mark as ${nextStatus}` }}
        </Button>
      </div>
    </div>
  </div>
</template>
