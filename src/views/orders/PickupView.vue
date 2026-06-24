<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Order, OrderItem } from '@/types'

const readyOrders = ref<Order[]>([])
const selectedOrder = ref<Order | null>(null)
const loading = ref(true)
const advancing = ref(false)
const verified = ref<Record<string, boolean>>({})
const scanSearch = ref('')

onMounted(async () => {
  try {
    const { data } = await ordersApi.list('ready')
    readyOrders.value = data.data ?? []
    if (readyOrders.value.length > 0) selectOrder(readyOrders.value[0])
  } finally {
    loading.value = false
  }
})

function selectOrder(o: Order) {
  selectedOrder.value = o
  verified.value = {}
  notified.value = false
}

function wpId(n: number) { return `WP-${n}` }

function initials(name: string) {
  return name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
}

function dueLabel(o: Order) {
  if (!o.due_at) return 'Today'
  const d = new Date(o.due_at)
  const diff = Math.round((d.getTime() - Date.now()) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold', dry_clean: 'Dry Clean',
  ironing: 'Ironing', wash_iron: 'Wash & Iron',
}

const filteredOrders = computed(() => {
  const q = scanSearch.value.toLowerCase()
  if (!q) return readyOrders.value
  return readyOrders.value.filter(
    (o) =>
      wpId(o.order_number).toLowerCase().includes(q) ||
      (o.customer?.name ?? '').toLowerCase().includes(q)
  )
})

function toggleVerify(item: OrderItem) {
  verified.value[item.name] = !verified.value[item.name]
}

const allVerified = computed(() =>
  selectedOrder.value ? selectedOrder.value.items.every((it) => verified.value[it.name]) : false
)

const verifyLabel = computed(() => {
  if (!selectedOrder.value) return ''
  const done = selectedOrder.value.items.filter((it) => verified.value[it.name]).length
  return `${done} / ${selectedOrder.value.items.length} verified`
})

const isPaid = computed(() => selectedOrder.value?.payment_status === 'paid')
const isCollected = ref(false)
const notifying = ref(false)
const notified = ref(false)

async function notifyCustomer() {
  if (!selectedOrder.value || notifying.value) return
  notifying.value = true
  try {
    await ordersApi.notifyReady(selectedOrder.value.id)
    notified.value = true
    setTimeout(() => { notified.value = false }, 4000)
  } catch {
    // silently ignore — backend logs the failure
  } finally {
    notifying.value = false
  }
}

async function markCollected() {
  if (!selectedOrder.value || !allVerified.value) return
  advancing.value = true
  try {
    await ordersApi.updateStatus(selectedOrder.value.id, 'picked_up')
    isCollected.value = true
    readyOrders.value = readyOrders.value.filter((o) => o.id !== selectedOrder.value!.id)
    setTimeout(() => {
      isCollected.value = false
      selectedOrder.value = readyOrders.value[0] ?? null
      verified.value = {}
    }, 1500)
  } finally {
    advancing.value = false
  }
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="Pickup" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">Loading…</div>

    <div v-else style="flex:1;overflow:auto;padding:26px 28px;display:flex;gap:18px;align-items:flex-start;">

      <!-- LEFT: Ready orders list -->
      <div style="width:320px;flex:none;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;">
        <div style="font-size:15px;font-weight:700;margin-bottom:13px;">Ready for pickup</div>

        <!-- Scan / search -->
        <div style="display:flex;align-items:center;gap:10px;background:#f3f0ec;border-radius:11px;padding:10px 13px;margin-bottom:14px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M7 9v6M11 9v6M15 9v6M18 9v6"/>
          </svg>
          <input
            v-model="scanSearch"
            placeholder="Scan ticket or search…"
            style="border:none;background:transparent;outline:none;font:inherit;font-size:13px;color:#5b6472;width:100%;"
          />
        </div>

        <!-- Order list -->
        <div style="display:flex;flex-direction:column;gap:9px;">
          <button
            v-for="o in filteredOrders"
            :key="o.id"
            @click="selectOrder(o)"
            :style="{
              display: 'flex', alignItems: 'center', gap: '11px',
              border: selectedOrder?.id === o.id ? '1px solid #FBD9C2' : '1px solid #ece8e3',
              background: selectedOrder?.id === o.id ? '#FEF1E9' : '#fff',
              borderRadius: '13px', padding: '12px', cursor: 'pointer',
              textAlign: 'left', font: 'inherit', width: '100%',
            }"
          >
            <div style="width:40px;height:40px;border-radius:11px;background:#F26F21;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none;">
              {{ initials(o.customer?.name ?? '') }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ o.customer?.name ?? '—' }}</div>
              <div style="font-size:11.5px;color:#9aa1ab;">{{ wpId(o.order_number) }} · {{ o.items.reduce((a, b) => a + b.qty, 0) }} items</div>
            </div>
            <div style="font-size:13.5px;font-weight:700;flex:none;">K{{ Number(o.total_price).toFixed(2) }}</div>
          </button>

          <div v-if="filteredOrders.length === 0" style="text-align:center;color:#9aa1ab;font-size:13.5px;padding:24px 0;">
            No orders ready for pickup
          </div>
        </div>
      </div>

      <!-- RIGHT: Verification + collection panel -->
      <div v-if="selectedOrder" style="flex:1;min-width:0;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:24px;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #f1eeea;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:54px;height:54px;border-radius:15px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;flex:none;">
              {{ initials(selectedOrder.customer?.name ?? '') }}
            </div>
            <div>
              <div style="font-size:19px;font-weight:800;letter-spacing:-0.3px;">{{ selectedOrder.customer?.name ?? '—' }}</div>
              <div style="font-size:13px;color:#9aa1ab;font-weight:600;">
                {{ wpId(selectedOrder.order_number) }} · {{ serviceLabels[selectedOrder.service_type] }} · Due {{ dueLabel(selectedOrder) }}
              </div>
            </div>
          </div>
          <span :style="{
            fontSize: '12.5px', fontWeight: '700', padding: '6px 13px', borderRadius: '9px',
            background: selectedOrder.payment_status === 'paid' ? '#e8f7ee' : selectedOrder.payment_status === 'partial' ? '#fff3e6' : '#fdeceb',
            color: selectedOrder.payment_status === 'paid' ? '#1f9d57' : selectedOrder.payment_status === 'partial' ? '#d77a18' : '#d6453d',
          }">
            {{ selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1) }}
          </span>
        </div>

        <div style="display:flex;gap:24px;margin-top:20px;align-items:flex-start;">

          <!-- Item checklist -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="font-size:14px;font-weight:700;">Verify items</div>
              <div style="font-size:12.5px;font-weight:700;color:#D85D14;">{{ verifyLabel }}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:9px;">
              <button
                v-for="item in selectedOrder.items"
                :key="item.name"
                @click="toggleVerify(item)"
                style="display:flex;align-items:center;gap:13px;border:1px solid #ece8e3;background:#fcfbf9;border-radius:12px;padding:13px 15px;cursor:pointer;text-align:left;font:inherit;width:100%;"
              >
                <span :style="{
                  width: '24px', height: '24px', borderRadius: '8px', flex: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${verified[item.name] ? '#1f9d57' : '#d8d2ca'}`,
                  background: verified[item.name] ? '#1f9d57' : 'transparent',
                }">
                  <svg v-if="verified[item.name]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </span>
                <span style="font-size:14px;font-weight:700;flex:1;">{{ item.name }}</span>
                <span style="font-size:13px;font-weight:700;color:#5b6472;">× {{ item.qty }}</span>
              </button>
            </div>
          </div>

          <!-- Collection panel -->
          <div style="width:280px;flex:none;background:#faf8f6;border:1px solid #f1eeea;border-radius:14px;padding:18px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:14px;">Collection</div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <span style="font-size:13.5px;color:#5b6472;">Amount due</span>
              <span style="font-size:20px;font-weight:800;">K{{ Number(selectedOrder.total_price).toFixed(2) }}</span>
            </div>

            <!-- Payment settled -->
            <div v-if="isPaid" style="display:flex;align-items:center;gap:9px;background:#e8f7ee;color:#1f9d57;border-radius:11px;padding:12px;font-size:13px;font-weight:700;margin-bottom:14px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Payment settled
            </div>

            <!-- Collected confirmation -->
            <div v-if="isCollected" style="display:flex;align-items:center;gap:9px;background:#FEF1E9;color:#D85D14;border-radius:11px;padding:12px;font-size:13px;font-weight:700;margin-bottom:14px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Collected — order complete
            </div>

            <!-- Notify customer button -->
            <button
              @click="notifyCustomer"
              :disabled="notifying || !selectedOrder.customer?.email"
              :style="{
                width: '100%', border: '1px solid #e2e8f0', font: 'inherit', fontWeight: '700',
                fontSize: '14px', padding: '13px', borderRadius: '12px', marginBottom: '10px',
                cursor: selectedOrder.customer?.email ? 'pointer' : 'not-allowed',
                background: notified ? '#e8f7ee' : selectedOrder.customer?.email ? '#f8fafc' : '#f1eeea',
                color: notified ? '#1f9d57' : selectedOrder.customer?.email ? '#334155' : '#aab0ba',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              }"
            >
              <svg v-if="notified" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              {{ notifying ? 'Sending…' : notified ? 'Email sent!' : 'Notify customer' }}
            </button>
            <div v-if="!selectedOrder.customer?.email" style="font-size:11px;color:#aab0ba;text-align:center;margin-bottom:10px;">
              No email on file for this customer
            </div>

            <button
              @click="markCollected"
              :disabled="advancing || !allVerified"
              :style="{
                width: '100%', border: 'none', font: 'inherit', fontWeight: '700',
                fontSize: '14px', padding: '14px', borderRadius: '12px', cursor: allVerified ? 'pointer' : 'not-allowed',
                background: allVerified ? '#F26F21' : '#f1eeea',
                color: allVerified ? '#fff' : '#aab0ba',
              }"
            >
              {{ advancing ? 'Updating…' : 'Mark as collected' }}
            </button>
            <div style="font-size:11.5px;color:#aab0ba;text-align:center;margin-top:9px;">
              Verify all items to enable
            </div>
          </div>
        </div>
      </div>

      <!-- No order selected -->
      <div v-else style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">
        Select an order from the list
      </div>
    </div>
  </div>
</template>
