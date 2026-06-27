<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { PDFViewer, PDFDownloadLink } from '@ceereals/vue-pdf'
import OrderReceiptDocument from '@/components/orders/OrderReceiptDocument.vue'
import type { Order, OrderStatus, OrderItem } from '@/types'

const route = useRoute()
const router = useRouter()

const order = ref<Order | null>(null)
const loading = ref(true)
const advancing = ref(false)
const verified = ref<Record<string, boolean>>({})

const statusFlow: OrderStatus[] = ['received', 'washing', 'ready', 'picked_up']

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  dry_clean: 'Dry Clean',
  ironing:   'Ironing',
  wash_iron: 'Wash & Iron',
}

onMounted(async () => {
  try {
    const { data } = await ordersApi.get(route.params.id as string)
    order.value = data.data
  } finally {
    loading.value = false
  }
})

function wpId(n: number) { return `WP-${n}` }

function initials(name: string) {
  return name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
}

function dueLabel(o: Order) {
  if (!o.due_at) return 'No due date'
  return new Date(o.due_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

// Due date picker
const editingDue = ref(false)
const dueInput = ref('')        // yyyy-MM-dd for the native date input
const savingDue = ref(false)

// Map an ISO/date string to the yyyy-MM-dd value a date input expects.
function toDateInput(d?: string | null) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10)
}

function openDueEditor() {
  if (!order.value) return
  dueInput.value = toDateInput(order.value.due_at)
  editingDue.value = true
}

async function saveDue() {
  if (!order.value || savingDue.value) return
  savingDue.value = true
  try {
    // Empty input clears the due date.
    const due_at = dueInput.value ? new Date(dueInput.value).toISOString() : null
    // The backend PUT is a full replace and requires items/service_type, so
    // send the existing order fields alongside the new due date.
    const { data } = await ordersApi.update(order.value.id, {
      service_type: order.value.service_type,
      items: order.value.items,
      notes: order.value.notes,
      due_at: due_at ?? undefined,
    })
    order.value = data.data
    editingDue.value = false
  } finally {
    savingDue.value = false
  }
}

const nextStatus = computed<OrderStatus | null>(() => {
  if (!order.value) return null
  const idx = statusFlow.indexOf(order.value.status)
  return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null
})

const nextStatusLabel: Record<OrderStatus, string> = {
  received:  'Move to Washing',
  washing:   'Mark as Ready',
  ready:     'Mark as Collected',
  picked_up: 'Collected',
}

async function advance() {
  if (!order.value || !nextStatus.value) return
  advancing.value = true
  try {
    const { data } = await ordersApi.updateStatus(order.value.id, nextStatus.value)
    order.value = data.data
  } finally {
    advancing.value = false
  }
}

function toggleVerify(item: OrderItem) {
  const key = item.name
  verified.value[key] = !verified.value[key]
}

const allVerified = computed(() => {
  if (!order.value) return false
  return order.value.items.every((it) => verified.value[it.name])
})

const verifyLabel = computed(() => {
  if (!order.value) return ''
  const done = order.value.items.filter((it) => verified.value[it.name]).length
  return `${done} / ${order.value.items.length} verified`
})

// PDF receipt modal
const showReceipt = ref(false)
const receiptOrder = computed(() => order.value!)
const pdfReady = ref(false)

watch(showReceipt, async (open) => {
  if (open) {
    pdfReady.value = false
    await nextTick()
    setTimeout(() => { pdfReady.value = true }, 300)
  }
})

// Mark as paid
const paymentMethods = [
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'transfer', label: 'Transfer' },
]
const showPaymentPanel = ref(false)
const selectedPaymentMethod = ref<'cash' | 'card' | 'transfer' | null>(null)
const markingPaid = ref(false)

async function markAsPaid() {
  if (!order.value || !selectedPaymentMethod.value) return
  markingPaid.value = true
  try {
    await ordersApi.updatePayment(order.value.id, 'paid', selectedPaymentMethod.value)
    order.value.payment_status = 'paid'
    order.value.payment_method = selectedPaymentMethod.value
    showPaymentPanel.value = false
  } finally {
    markingPaid.value = false
  }
}

// Payment status
const paymentMeta: Record<string, { bg: string; fg: string }> = {
  unpaid:  { bg: '#fdeceb', fg: '#d6453d' },
  partial: { bg: '#fff3e6', fg: '#d77a18' },
  paid:    { bg: '#e8f7ee', fg: '#1f9d57' },
}

const statusMeta: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  received:  { bg: '#eef2ff', fg: '#4154d6', label: 'Received' },
  washing:   { bg: '#e7f6f8', fg: '#0e8a93', label: 'Washing' },
  ready:     { bg: '#e8f7ee', fg: '#1f9d57', label: 'Ready' },
  picked_up: { bg: '#eef0f2', fg: '#6b7280', label: 'Collected' },
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader :title="order ? `Order ${wpId(order.order_number)}` : 'Order Detail'" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">
      Loading…
    </div>

    <div v-else-if="order" style="flex:1;overflow:auto;padding:26px 28px;display:flex;gap:18px;align-items:flex-start;">

      <!-- LEFT: order list panel (mimics "Ready for pickup" list) -->
      <div style="width:320px;flex:none;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;">
        <div style="font-size:15px;font-weight:700;margin-bottom:16px;">Order details</div>

        <!-- Customer card -->
        <div style="display:flex;align-items:center;gap:14px;padding:14px;background:#faf8f6;border:1px solid #f1eeea;border-radius:13px;margin-bottom:14px;">
          <div style="width:46px;height:46px;border-radius:13px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex:none;">
            {{ initials(order.customer?.name ?? '') }}
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;">{{ order.customer?.name ?? '—' }}</div>
            <div style="font-size:12.5px;color:#9aa1ab;">{{ order.customer?.phone }}</div>
          </div>
        </div>

        <!-- Meta rows -->
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#9aa1ab;font-weight:500;">Status</span>
            <span :style="{ fontWeight: '700', padding: '3px 10px', borderRadius: '7px', fontSize: '12px', background: statusMeta[order.status].bg, color: statusMeta[order.status].fg }">
              {{ statusMeta[order.status].label }}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#9aa1ab;font-weight:500;">Service</span>
            <span style="font-weight:600;">{{ serviceLabels[order.service_type] ?? order.service_type }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;min-height:24px;">
            <span style="color:#9aa1ab;font-weight:500;">Due</span>
            <!-- Display mode: click to edit -->
            <button
              v-if="!editingDue"
              @click="openDueEditor"
              style="display:flex;align-items:center;gap:6px;border:none;background:transparent;font:inherit;font-weight:600;font-size:13.5px;color:#222831;cursor:pointer;padding:0;"
              title="Set due date"
            >
              {{ dueLabel(order) }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D85D14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </button>
            <!-- Edit mode: date input + save/cancel -->
            <div v-else style="display:flex;align-items:center;gap:6px;">
              <input
                v-model="dueInput"
                type="date"
                style="border:1px solid #ece8e3;border-radius:8px;padding:4px 7px;font:inherit;font-size:12.5px;color:#222831;outline:none;"
              />
              <button
                @click="saveDue"
                :disabled="savingDue"
                style="border:none;background:#F26F21;color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;"
                title="Save"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button
                @click="editingDue = false"
                style="border:1px solid #ece8e3;background:#fff;color:#5b6472;border-radius:8px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;"
                title="Cancel"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#9aa1ab;font-weight:500;">Received</span>
            <span style="font-weight:600;">{{ new Date(order.received_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
          <div v-if="order.picked_up_at" style="display:flex;justify-content:space-between;">
            <span style="color:#9aa1ab;font-weight:500;">Collected</span>
            <span style="font-weight:600;">{{ new Date(order.picked_up_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) }}</span>
          </div>
        </div>

        <!-- Back button -->
        <button
          @click="router.back()"
          style="margin-top:20px;width:100%;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13px;padding:11px;border-radius:11px;cursor:pointer;"
        >
          ← Back
        </button>
      </div>

      <!-- RIGHT: verification + collection panel -->
      <div style="flex:1;min-width:0;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:24px;">

        <!-- Header row -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #f1eeea;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:54px;height:54px;border-radius:15px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;flex:none;">
              {{ initials(order.customer?.name ?? '') }}
            </div>
            <div>
              <div style="font-size:19px;font-weight:800;letter-spacing:-0.3px;">{{ order.customer?.name ?? '—' }}</div>
              <div style="font-size:13px;color:#9aa1ab;font-weight:600;">
                {{ wpId(order.order_number) }} · {{ serviceLabels[order.service_type] }} · Due {{ dueLabel(order) }}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span :style="{ fontSize: '12.5px', fontWeight: '700', padding: '6px 13px', borderRadius: '9px', background: paymentMeta[order.payment_status]?.bg ?? '#eef0f2', color: paymentMeta[order.payment_status]?.fg ?? '#6b7280' }">
              {{ order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) }}
            </span>
            <button
              @click="showReceipt = true"
              title="Print receipt"
              style="width:36px;height:36px;border-radius:10px;border:1px solid #ece8e3;background:#fff;color:#5b6472;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
        </div>

        <div style="display:flex;gap:24px;margin-top:20px;align-items:flex-start;">

          <!-- Item verification checklist -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="font-size:14px;font-weight:700;">Verify items</div>
              <div style="font-size:12.5px;font-weight:700;color:#D85D14;">{{ verifyLabel }}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:9px;">
              <button
                v-for="item in order.items"
                :key="item.name"
                @click="toggleVerify(item)"
                style="display:flex;align-items:center;gap:13px;border:1px solid #ece8e3;background:#fcfbf9;border-radius:12px;padding:13px 15px;cursor:pointer;text-align:left;font:inherit;width:100%;"
              >
                <span
                  :style="{
                    width: '24px', height: '24px', borderRadius: '8px', flex: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${verified[item.name] ? '#1f9d57' : '#d8d2ca'}`,
                    background: verified[item.name] ? '#1f9d57' : 'transparent',
                  }"
                >
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

            <!-- Amount breakdown -->
            <div style="display:flex;flex-direction:column;gap:7px;font-size:13.5px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;color:#5b6472;">
                <span>Subtotal</span><span style="font-weight:600;color:#222831;">K{{ Number(order.subtotal).toFixed(2) }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;color:#5b6472;">
                <span>Tax (7.5%)</span><span style="font-weight:600;color:#222831;">K{{ Number(order.tax_amount).toFixed(2) }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ece8e3;padding-top:10px;margin-top:3px;">
                <span style="color:#5b6472;">Amount due</span>
                <span style="font-size:20px;font-weight:800;">K{{ Number(order.total_price).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Payment settled banner -->
            <div v-if="order.payment_status === 'paid'" style="display:flex;align-items:center;gap:9px;background:#e8f7ee;color:#1f9d57;border-radius:11px;padding:12px;font-size:13px;font-weight:700;margin-bottom:14px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Payment settled
            </div>

            <!-- Mark as paid panel -->
            <div v-if="order.payment_status !== 'paid'" style="margin-bottom:14px;">
              <button
                v-if="!showPaymentPanel"
                @click="showPaymentPanel = true"
                style="width:100%;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13.5px;padding:12px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                </svg>
                Mark as paid
              </button>
              <div v-else style="border:1px solid #FBD9C2;border-radius:12px;padding:13px;">
                <div style="font-size:12px;font-weight:700;color:#aab0ba;letter-spacing:0.3px;margin-bottom:9px;">SELECT PAYMENT METHOD</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:11px;">
                  <button
                    v-for="m in paymentMethods"
                    :key="m.key"
                    @click="selectedPaymentMethod = m.key as any"
                    :style="{
                      border: selectedPaymentMethod === m.key ? '1px solid #FBD9C2' : '1px solid #ece8e3',
                      background: selectedPaymentMethod === m.key ? '#FEF1E9' : '#fff',
                      color: selectedPaymentMethod === m.key ? '#D85D14' : '#5b6472',
                      font: 'inherit', fontWeight: '700', fontSize: '13px',
                      padding: '9px 6px', borderRadius: '9px', cursor: 'pointer',
                    }"
                  >{{ m.label }}</button>
                </div>
                <div style="display:flex;gap:7px;">
                  <button
                    @click="showPaymentPanel = false; selectedPaymentMethod = null"
                    style="flex:1;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13px;padding:10px;border-radius:10px;cursor:pointer;"
                  >Cancel</button>
                  <button
                    @click="markAsPaid"
                    :disabled="!selectedPaymentMethod || markingPaid"
                    :style="{
                      flex: 2, border: 'none', font: 'inherit', fontWeight: '700', fontSize: '13px',
                      padding: '10px', borderRadius: '10px', cursor: selectedPaymentMethod ? 'pointer' : 'not-allowed',
                      background: selectedPaymentMethod ? '#F26F21' : '#f1eeea',
                      color: selectedPaymentMethod ? '#fff' : '#aab0ba',
                    }"
                  >{{ markingPaid ? 'Saving…' : 'Confirm payment' }}</button>
                </div>
              </div>
            </div>

            <!-- Collected banner -->
            <div v-if="order.status === 'picked_up'" style="display:flex;align-items:center;gap:9px;background:#FEF1E9;color:#D85D14;border-radius:11px;padding:12px;font-size:13px;font-weight:700;margin-bottom:14px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Collected — order complete
            </div>

            <!-- Advance / Collect button -->
            <button
              v-if="nextStatus"
              @click="advance"
              :disabled="advancing || (nextStatus === 'picked_up' && !allVerified)"
              :style="{
                width: '100%', border: 'none', font: 'inherit', fontWeight: '700',
                fontSize: '14px', padding: '14px', borderRadius: '12px', cursor: 'pointer',
                background: (nextStatus === 'picked_up' && !allVerified) ? '#f1eeea' : '#F26F21',
                color: (nextStatus === 'picked_up' && !allVerified) ? '#aab0ba' : '#fff',
              }"
            >
              {{ advancing ? 'Updating…' : nextStatusLabel[order.status] }}
            </button>

            <div v-if="nextStatus === 'picked_up' && !allVerified" style="font-size:11.5px;color:#aab0ba;text-align:center;margin-top:9px;">
              Verify all items to enable
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Receipt PDF modal -->
    <Teleport to="body">
      <div
        v-if="showReceipt && order"
        style="position:fixed;inset:0;display:flex;align-items:stretch;justify-content:flex-end;z-index:1000;"
        @click.self="showReceipt = false"
      >
        <div style="position:absolute;inset:0;background:rgba(34,40,49,0.5);backdrop-filter:blur(4px);"></div>
        <div style="position:relative;width:min(680px,100vw);background:#fff;display:flex;flex-direction:column;box-shadow:-24px 0 48px -12px rgba(0,0,0,0.18);">

          <!-- Sheet header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #ece8e3;flex:none;">
            <div>
              <div style="font-size:15px;font-weight:700;">Receipt</div>
              <div style="font-size:12.5px;color:#9aa1ab;margin-top:2px;">{{ wpId(receiptOrder.order_number) }} · {{ receiptOrder.customer?.name }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <!-- Download link -->
              <PDFDownloadLink v-if="pdfReady" :file-name="`WashPoint-${wpId(receiptOrder.order_number)}.pdf`">
                <template #default>
                  <OrderReceiptDocument :order="receiptOrder" />
                </template>
                <template #label>
                  <button style="display:flex;align-items:center;gap:7px;border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:13px;padding:9px 15px;border-radius:10px;cursor:pointer;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download PDF
                  </button>
                </template>
              </PDFDownloadLink>
              <!-- Close -->
              <button
                @click="showReceipt = false"
                style="width:34px;height:34px;border-radius:9px;border:1px solid #ece8e3;background:#fff;color:#5b6472;cursor:pointer;display:flex;align-items:center;justify-content:center;"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- PDF preview -->
          <div style="flex:1;min-height:0;overflow:hidden;background:#f3f0ec;display:flex;align-items:center;justify-content:center;">
            <div v-if="!pdfReady" style="display:flex;flex-direction:column;align-items:center;gap:12px;color:#9aa1ab;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="animation:spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <span style="font-size:13.5px;">Generating preview…</span>
            </div>
            <PDFViewer
              v-else
              :key="receiptOrder.id"
              :show-toolbar="false"
              style="width:100%;height:100%;"
            >
              <OrderReceiptDocument :order="receiptOrder" />
            </PDFViewer>
          </div>

        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
