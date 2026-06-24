<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Order, OrderStatus } from '@/types'

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(false)

const confirm = ref<{ order: Order; next: OrderStatus } | null>(null)
const advancing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await ordersApi.list()
    orders.value = data.data ?? []
  } finally {
    loading.value = false
  }
})

const nextStatusLabel: Record<OrderStatus, string> = {
  received:  'Washing',
  washing:   'Ready for Pickup',
  ready:     'Collected',
  picked_up: '',
}

function requestAdvance(order: Order) {
  const seq: OrderStatus[] = ['received', 'washing', 'ready', 'picked_up']
  const idx = seq.indexOf(order.status)
  if (idx < 0 || idx >= seq.length - 1) return
  confirm.value = { order, next: seq[idx + 1] }
}

async function confirmAdvance() {
  if (!confirm.value) return
  const { order, next } = confirm.value
  advancing.value = true
  try {
    await ordersApi.updateStatus(order.id, next)
    order.status = next
    confirm.value = null
  } finally {
    advancing.value = false
  }
}

function cancelConfirm() {
  confirm.value = null
}

const columns: { key: OrderStatus; label: string; dot: string }[] = [
  { key: 'received',  label: 'Received',  dot: '#4154d6' },
  { key: 'washing',   label: 'Washing',   dot: '#0e8a93' },
  { key: 'ready',     label: 'Ready',     dot: '#1f9d57' },
  { key: 'picked_up', label: 'Collected', dot: '#6b7280' },
]

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  dry_clean: 'Dry Clean',
  ironing:   'Ironing',
  wash_iron: 'Wash & Iron',
}

function colOrders(key: OrderStatus) {
  return orders.value.filter((o) => o.status === key)
}

function wpId(n: number) {
  return `WP-${n}`
}

function initials(name: string) {
  return name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
}

function itemCount(items: Order['items']) {
  const n = items.reduce((a, b) => a + b.qty, 0)
  return `${n} item${n !== 1 ? 's' : ''}`
}

function dueLabel(order: Order) {
  if (!order.due_at) return 'No due date'
  const d = new Date(order.due_at)
  const diff = Math.round((d.getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return 'Overdue'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="Processing" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">
      Loading…
    </div>

    <div v-else style="flex:1;overflow:auto;padding:26px 28px;">

      <!-- Subheader -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:13.5px;color:#9aa1ab;font-weight:500;">
          Tap <span style="color:#D85D14;font-weight:700;">→</span> on a card to advance its status
        </div>
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

      <!-- Kanban columns -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start;">
        <div
          v-for="col in columns"
          :key="col.key"
          style="background:#f1eeea;border-radius:16px;padding:14px;"
        >
          <!-- Column header -->
          <div style="display:flex;align-items:center;gap:8px;padding:2px 4px 13px;">
            <span :style="{ width: '9px', height: '9px', borderRadius: '50%', background: col.dot, display: 'inline-block' }"></span>
            <span style="font-size:13.5px;font-weight:700;">{{ col.label }}</span>
            <span style="margin-left:auto;font-size:12px;font-weight:700;color:#8a8f98;background:#fff;border-radius:7px;padding:2px 9px;">
              {{ colOrders(col.key).length }}
            </span>
          </div>

          <!-- Cards -->
          <div style="display:flex;flex-direction:column;gap:11px;">
            <div
              v-for="order in colOrders(col.key)"
              :key="order.id"
              style="background:#fff;border-radius:13px;padding:14px;border:1px solid #eae6e1;cursor:pointer;"
              @click="router.push(`/orders/${order.id}`)"
            >
              <!-- Customer row -->
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:10px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;flex:none;">
                  {{ initials(order.customer?.name ?? '') }}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ order.customer?.name ?? '—' }}</div>
                  <div style="font-size:11.5px;color:#9aa1ab;font-weight:600;">{{ wpId(order.order_number) }}</div>
                </div>
              </div>

              <!-- Tags -->
              <div style="display:flex;align-items:center;gap:6px;margin-top:11px;flex-wrap:wrap;">
                <span style="font-size:11.5px;font-weight:600;color:#5b6472;background:#f3f0ec;border-radius:7px;padding:3px 9px;">
                  {{ itemCount(order.items) }}
                </span>
                <span style="font-size:11.5px;font-weight:600;color:#5b6472;background:#f3f0ec;border-radius:7px;padding:3px 9px;">
                  {{ serviceLabels[order.service_type] ?? order.service_type }}
                </span>
              </div>

              <!-- Footer: due + advance button -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
                <div style="font-size:11.5px;color:#9aa1ab;font-weight:600;display:flex;align-items:center;gap:5px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                  </svg>
                  {{ dueLabel(order) }}
                </div>
                <button
                  v-if="col.key !== 'picked_up'"
                  @click.stop="requestAdvance(order)"
                  style="width:30px;height:30px;border-radius:9px;border:1px solid #FBD9C2;background:#FEF1E9;color:#D85D14;cursor:pointer;display:flex;align-items:center;justify-content:center;"
                  title="Advance status"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="colOrders(col.key).length === 0"
              style="text-align:center;font-size:12.5px;color:#bbb;padding:20px 0;font-weight:500;"
            >
              No orders
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation dialog -->
    <Teleport to="body">
      <div
        v-if="confirm"
        style="position:fixed;inset:0;background:rgba(34,40,49,0.45);display:flex;align-items:center;justify-content:center;z-index:1000;"
        @click.self="cancelConfirm"
      >
        <div style="background:#fff;border-radius:20px;padding:28px 28px 24px;width:360px;box-shadow:0 24px 48px -12px rgba(0,0,0,0.22);">

          <!-- Icon -->
          <div style="width:48px;height:48px;border-radius:14px;background:#FEF1E9;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D85D14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </div>

          <!-- Title -->
          <div style="font-size:17px;font-weight:800;letter-spacing:-0.2px;margin-bottom:8px;">Move order?</div>

          <!-- Body text -->
          <div style="font-size:14px;color:#5b6472;line-height:1.55;margin-bottom:22px;">
            Move <strong style="color:#222831;">{{ confirm.order.customer?.name ?? 'this customer' }}</strong>'s
            order <strong style="color:#222831;">{{ wpId(confirm.order.order_number) }}</strong>
            to <strong style="color:#D85D14;">{{ nextStatusLabel[confirm.order.status] }}</strong>?
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:10px;">
            <button
              @click="cancelConfirm"
              style="flex:1;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:14px;padding:12px;border-radius:12px;cursor:pointer;"
            >
              Cancel
            </button>
            <button
              @click="confirmAdvance"
              :disabled="advancing"
              style="flex:1;border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:12px;border-radius:12px;cursor:pointer;box-shadow:0 8px 18px -8px #F26F21;"
            >
              {{ advancing ? 'Moving…' : 'Yes, move it' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
