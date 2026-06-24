<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Customer, Order, OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()

const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])
const loading = ref(true)

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold', dry_clean: 'Dry Clean',
  ironing: 'Ironing', wash_iron: 'Wash & Iron',
}

const statusMeta: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  received:  { bg: '#eef2ff', fg: '#4154d6', label: 'Received' },
  washing:   { bg: '#e7f6f8', fg: '#0e8a93', label: 'Washing' },
  ready:     { bg: '#e8f7ee', fg: '#1f9d57', label: 'Ready' },
  picked_up: { bg: '#eef0f2', fg: '#6b7280', label: 'Collected' },
}

onMounted(async () => {
  const id = route.params.id as string
  try {
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

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function memberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

function wpId(n: number) { return `WP-${n}` }
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader :title="customer?.name ?? 'Customer'" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">Loading…</div>

    <div v-else-if="customer" style="flex:1;overflow:auto;padding:26px 28px;display:flex;gap:18px;align-items:flex-start;">

      <!-- LEFT: Customer profile -->
      <div style="width:300px;flex:none;display:flex;flex-direction:column;gap:14px;">

        <!-- Profile card -->
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
            <div style="width:54px;height:54px;border-radius:15px;background:#F26F21;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;flex:none;">
              {{ initials(customer.name) }}
            </div>
            <div>
              <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px;">{{ customer.name }}</div>
              <div style="font-size:12px;font-weight:700;color:#1f9d57;background:#e8f7ee;padding:2px 9px;border-radius:7px;display:inline-block;margin-top:3px;">
                {{ customer.total_orders ?? 0 }} orders
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:11px;font-size:13.5px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#9aa1ab;font-weight:500;">Phone</span>
              <span style="font-weight:600;">{{ customer.phone }}</span>
            </div>
            <div v-if="customer.email" style="display:flex;justify-content:space-between;">
              <span style="color:#9aa1ab;font-weight:500;">Email</span>
              <span style="font-weight:600;">{{ customer.email }}</span>
            </div>
            <div v-if="customer.address" style="display:flex;justify-content:space-between;">
              <span style="color:#9aa1ab;font-weight:500;">Address</span>
              <span style="font-weight:600;text-align:right;max-width:160px;">{{ customer.address }}</span>
            </div>
            <div v-if="customer.notes" style="display:flex;justify-content:space-between;">
              <span style="color:#9aa1ab;font-weight:500;">Notes</span>
              <span style="font-weight:600;text-align:right;max-width:160px;">{{ customer.notes }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid #f1eeea;padding-top:11px;margin-top:2px;">
              <span style="color:#9aa1ab;font-weight:500;">Member since</span>
              <span style="font-weight:600;">{{ memberSince(customer.created_at) }}</span>
            </div>
          </div>
        </div>

        <button
          @click="router.back()"
          style="width:100%;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13px;padding:11px;border-radius:11px;cursor:pointer;"
        >← Back</button>
      </div>

      <!-- RIGHT: Order history -->
      <div style="flex:1;min-width:0;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px 22px;">
        <div style="font-size:16px;font-weight:700;margin-bottom:14px;">Order history</div>

        <!-- Table header -->
        <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr 0.8fr 0.8fr;font-size:11px;font-weight:700;letter-spacing:0.4px;color:#aab0ba;padding:0 4px 10px;border-bottom:1px solid #f1eeea;">
          <div>ORDER</div><div>SERVICE</div><div>TOTAL</div><div>PAYMENT</div><div style="text-align:right;">STATUS</div>
        </div>

        <div
          v-for="o in orders"
          :key="o.id"
          @click="router.push(`/orders/${o.id}`)"
          style="display:grid;grid-template-columns:1fr 1.4fr 1fr 0.8fr 0.8fr;align-items:center;font-size:13px;padding:13px 4px;border-bottom:1px solid #f6f3ef;cursor:pointer;"
          @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')"
          @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <div style="font-weight:700;color:#5b6472;">{{ wpId(o.order_number) }}</div>
          <div style="color:#5b6472;">{{ serviceLabels[o.service_type] ?? o.service_type }}</div>
          <div style="font-weight:700;">K{{ Number(o.total_price).toFixed(2) }}</div>
          <div>
            <span :style="{ fontSize: '11.5px', fontWeight: '700', padding: '3px 9px', borderRadius: '7px', background: o.payment_status === 'paid' ? '#e8f7ee' : o.payment_status === 'partial' ? '#fff3e6' : '#fdeceb', color: o.payment_status === 'paid' ? '#1f9d57' : o.payment_status === 'partial' ? '#d77a18' : '#d6453d' }">
              {{ o.payment_status.charAt(0).toUpperCase() + o.payment_status.slice(1) }}
            </span>
          </div>
          <div style="text-align:right;">
            <span :style="{ fontSize: '11.5px', fontWeight: '700', padding: '3px 9px', borderRadius: '7px', background: statusMeta[o.status].bg, color: statusMeta[o.status].fg }">
              {{ statusMeta[o.status].label }}
            </span>
          </div>
        </div>

        <div v-if="orders.length === 0" style="text-align:center;color:#9aa1ab;font-size:14px;padding:32px 0;">
          No orders yet
        </div>
      </div>
    </div>
  </div>
</template>
