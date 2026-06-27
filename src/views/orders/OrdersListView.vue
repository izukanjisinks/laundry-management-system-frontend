<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Order, OrderStatus } from '@/types'

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(false)
const exporting = ref(false)

async function exportCsv() {
  if (exporting.value) return
  exporting.value = true
  try {
    const res = await ordersApi.exportCsv()
    const disposition: string = res.headers['content-disposition'] ?? ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] ?? `washpoint-orders-${new Date().toISOString().slice(0, 10)}.csv`
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

const search = ref('')
const statusFilter = ref<OrderStatus | 'all'>('all')

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await ordersApi.list()
    orders.value = data.data ?? []
  } finally {
    loading.value = false
  }
})

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  dry_clean: 'Dry Clean',
  ironing:   'Ironing',
  wash_iron: 'Wash & Iron',
}

const statusMeta: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  received:  { bg: '#eef2ff', fg: '#4154d6', label: 'Received' },
  washing:   { bg: '#e7f6f8', fg: '#0e8a93', label: 'Washing' },
  ready:     { bg: '#e8f7ee', fg: '#1f9d57', label: 'Ready' },
  picked_up: { bg: '#eef0f2', fg: '#6b7280', label: 'Collected' },
}

const paymentMeta: Record<string, { bg: string; fg: string }> = {
  unpaid:  { bg: '#fdeceb', fg: '#d6453d' },
  partial: { bg: '#fff3e6', fg: '#d77a18' },
  paid:    { bg: '#e8f7ee', fg: '#1f9d57' },
}

const statusTabs: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'received',  label: 'Received' },
  { key: 'washing',   label: 'Washing' },
  { key: 'ready',     label: 'Ready' },
  { key: 'picked_up', label: 'Collected' },
]

function wpId(n: number) { return `WP-${n}` }

function initials(name: string) {
  return name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
}

function itemCount(items: Order['items']) {
  const n = items.reduce((a, b) => a + b.qty, 0)
  return `${n} item${n !== 1 ? 's' : ''}`
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dueLabel(o: Order) {
  if (!o.due_at) return 'No due date'
  const d = new Date(o.due_at)
  const diff = Math.round((d.getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return 'Overdue'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const filteredOrders = computed(() => {
  const q = search.value.toLowerCase().trim()
  return orders.value
    .filter((o) => statusFilter.value === 'all' || o.status === statusFilter.value)
    .filter((o) => {
      if (!q) return true
      return (
        wpId(o.order_number).toLowerCase().includes(q) ||
        (o.customer?.name ?? '').toLowerCase().includes(q) ||
        (o.customer?.phone ?? '').includes(q)
      )
    })
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
})

function countFor(key: OrderStatus | 'all') {
  if (key === 'all') return orders.value.length
  return orders.value.filter((o) => o.status === key).length
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="All Orders" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">
      Loading…
    </div>

    <div v-else style="flex:1;overflow:auto;padding:26px 28px;">

      <!-- Toolbar: search + status filter + new order -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
        <!-- Search -->
        <div style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #ece8e3;border-radius:11px;padding:10px 13px;min-width:260px;flex:1;max-width:380px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>
          </svg>
          <input
            v-model="search"
            placeholder="Search order #, customer or phone…"
            style="border:none;background:transparent;outline:none;font:inherit;font-size:13.5px;color:#5b6472;width:100%;"
          />
        </div>

        <!-- Status tabs -->
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            @click="statusFilter = tab.key"
            :style="{
              border: statusFilter === tab.key ? '1px solid #FBD9C2' : '1px solid #ece8e3',
              background: statusFilter === tab.key ? '#FEF1E9' : '#fff',
              color: statusFilter === tab.key ? '#D85D14' : '#5b6472',
              font: 'inherit', fontWeight: '600', fontSize: '12.5px',
              padding: '8px 13px', borderRadius: '9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
            }"
          >
            {{ tab.label }}
            <span :style="{
              fontSize: '11px', fontWeight: '700', borderRadius: '6px', padding: '1px 7px',
              background: statusFilter === tab.key ? '#fff' : '#f3f0ec',
              color: statusFilter === tab.key ? '#D85D14' : '#8a8f98',
            }">{{ countFor(tab.key) }}</span>
          </button>
        </div>

        <div style="margin-left:auto;display:flex;align-items:center;gap:9px;flex:none;">
          <button
            @click="exportCsv"
            :disabled="exporting"
            style="border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13px;padding:10px 16px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:7px;"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ exporting ? 'Exporting…' : 'Export CSV' }}
          </button>
          <button
            @click="router.push('/orders/new')"
            style="border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:13px;padding:10px 16px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:7px;"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New order
          </button>
        </div>
      </div>

      <!-- Orders table -->
      <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;overflow:hidden;">
        <!-- Header row -->
        <div style="display:grid;grid-template-columns:1.6fr 0.9fr 1fr 1fr 1fr 0.9fr 0.6fr;gap:12px;padding:14px 20px;background:#faf8f6;border-bottom:1px solid #f1eeea;font-size:11px;font-weight:700;letter-spacing:0.4px;color:#aab0ba;text-transform:uppercase;">
          <div>Customer</div>
          <div>Order #</div>
          <div>Service</div>
          <div>Status</div>
          <div>Payment</div>
          <div style="text-align:right;">Total</div>
          <div style="text-align:right;">Due</div>
        </div>

        <!-- Rows -->
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          @click="router.push(`/orders/${order.id}`)"
          style="display:grid;grid-template-columns:1.6fr 0.9fr 1fr 1fr 1fr 0.9fr 0.6fr;gap:12px;align-items:center;padding:13px 20px;border-bottom:1px solid #f6f3ef;cursor:pointer;font-size:13.5px;"
          @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')"
          @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#fff')"
        >
          <!-- Customer -->
          <div style="display:flex;align-items:center;gap:11px;min-width:0;">
            <div style="width:36px;height:36px;border-radius:10px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;flex:none;">
              {{ initials(order.customer?.name ?? '') }}
            </div>
            <div style="min-width:0;">
              <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ order.customer?.name ?? '—' }}</div>
              <div style="font-size:11.5px;color:#9aa1ab;">{{ itemCount(order.items) }} · {{ fmtDate(order.received_at) }}</div>
            </div>
          </div>

          <!-- Order # -->
          <div style="font-weight:700;color:#5b6472;">{{ wpId(order.order_number) }}</div>

          <!-- Service -->
          <div style="color:#5b6472;">{{ serviceLabels[order.service_type] ?? order.service_type }}</div>

          <!-- Status -->
          <div>
            <span :style="{ fontSize: '12px', fontWeight: '700', padding: '4px 11px', borderRadius: '7px', background: statusMeta[order.status].bg, color: statusMeta[order.status].fg }">
              {{ statusMeta[order.status].label }}
            </span>
          </div>

          <!-- Payment -->
          <div>
            <span :style="{ fontSize: '12px', fontWeight: '700', padding: '4px 11px', borderRadius: '7px', background: paymentMeta[order.payment_status]?.bg ?? '#eef0f2', color: paymentMeta[order.payment_status]?.fg ?? '#6b7280' }">
              {{ order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) }}
            </span>
          </div>

          <!-- Total -->
          <div style="text-align:right;font-weight:800;">K{{ Number(order.total_price).toFixed(2) }}</div>

          <!-- Due -->
          <div style="text-align:right;font-size:12.5px;font-weight:600;color:#5b6472;">{{ dueLabel(order) }}</div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredOrders.length === 0" style="text-align:center;color:#9aa1ab;font-size:13.5px;padding:48px 0;">
          No orders found
        </div>
      </div>

      <!-- Result count -->
      <div v-if="filteredOrders.length" style="font-size:12.5px;color:#9aa1ab;margin-top:12px;padding-left:4px;">
        Showing {{ filteredOrders.length }} of {{ orders.length }} order{{ orders.length !== 1 ? 's' : '' }}
      </div>
    </div>
  </div>
</template>
