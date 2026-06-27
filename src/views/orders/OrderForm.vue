<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import { customersApi } from '@/api/customers'
import { catalogApi } from '@/api/catalog'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Customer, CatalogItem, ServiceType } from '@/types'

const router = useRouter()
const customers = ref<Customer[]>([])
const catalog = ref<CatalogItem[]>([])
const error = ref('')
const submitting = ref(false)

// Customer selection
const customerSearch = ref('')
const selectedCustomer = ref<Customer | null>(null)
const showCustomerDropdown = ref(false)

// Service type
const serviceTab = ref<ServiceType>('wash_fold')
const serviceTabs: { key: ServiceType; label: string }[] = [
  { key: 'wash_fold', label: 'Wash & Fold' },
  { key: 'dry_clean', label: 'Dry Clean' },
  { key: 'ironing',   label: 'Ironing' },
  { key: 'wash_iron', label: 'Wash & Iron' },
]

// Order items: { catalogKey, name, price, qty }
interface LineItem { key: string; name: string; price: number; qty: number }
const orderItems = ref<LineItem[]>([])

// Payment
const paymentMethod = ref<'cash' | 'card' | 'transfer' | null>(null)
const paymentOpts = [
  { key: 'cash',     label: 'Cash' },
  { key: 'card',     label: 'Card' },
  { key: 'transfer', label: 'Transfer' },
]

// Distribute each catalog item's price across the K50–K100 range.
// Derived deterministically from the slug so a given item always keeps the
// same price between reloads (rather than jumping around on each visit).
function distributedPrice(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  // 50.00 – 100.00 inclusive, rounded to whole kwacha
  return 50 + (hash % 51)
}

onMounted(async () => {
  const [custRes, catRes] = await Promise.all([customersApi.list(), catalogApi.list()])
  customers.value = custRes.data.data ?? []
  catalog.value = (catRes.data.data ?? []).map((item) => ({
    ...item,
    base_price: distributedPrice(item.slug),
  }))
})

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase()
  if (!q) return customers.value.slice(0, 8)
  return customers.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
  ).slice(0, 8)
})

function hideDropdown() {
  setTimeout(() => { showCustomerDropdown.value = false }, 150)
}

function selectCustomer(c: Customer) {
  selectedCustomer.value = c
  customerSearch.value = ''
  showCustomerDropdown.value = false
}

function memberSince(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

function addItem(item: CatalogItem) {
  const existing = orderItems.value.find((o) => o.key === item.slug)
  if (existing) {
    existing.qty++
  } else {
    orderItems.value.push({ key: item.slug, name: item.name, price: item.base_price, qty: 1 })
  }
}

function changeQty(key: string, delta: number) {
  const idx = orderItems.value.findIndex((o) => o.key === key)
  if (idx === -1) return
  const next = orderItems.value[idx].qty + delta
  if (next <= 0) orderItems.value.splice(idx, 1)
  else orderItems.value[idx].qty = next
}

const subtotal = computed(() =>
  orderItems.value.reduce((sum, o) => sum + o.price * o.qty, 0)
)
const taxAmount = computed(() => Math.round(subtotal.value * 0.075 * 100) / 100)
const total = computed(() => Math.round((subtotal.value + taxAmount.value) * 100) / 100)

const itemCount = computed(() => {
  const n = orderItems.value.reduce((s, o) => s + o.qty, 0)
  return `${n} item${n !== 1 ? 's' : ''}`
})

function letterFor(name: string) {
  return name.charAt(0).toUpperCase()
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

async function submit() {
  if (!selectedCustomer.value) { error.value = 'Please select a customer'; return }
  if (orderItems.value.length === 0) { error.value = 'Please add at least one item'; return }
  submitting.value = true
  error.value = ''
  try {
    const { data } = await ordersApi.create({
      customer_id: selectedCustomer.value.id,
      service_type: serviceTab.value,
      items: orderItems.value.map((o) => ({ name: o.name, qty: o.qty, price: o.price })),
    })
    const orderId = data.data.id
    if (paymentMethod.value) {
      await ordersApi.updatePayment(orderId, 'paid', paymentMethod.value)
    }
    router.push(`/orders/${orderId}`)
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Failed to create order'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="New Order" />

    <div style="flex:1;overflow:auto;padding:26px 28px;display:flex;gap:18px;align-items:flex-start;">

      <!-- LEFT: Customer panel -->
      <div style="width:300px;flex:none;display:flex;flex-direction:column;gap:18px;">
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;">
          <div style="font-size:15px;font-weight:700;margin-bottom:13px;">Customer</div>

          <!-- Search -->
          <div style="position:relative;">
            <div style="display:flex;align-items:center;gap:10px;background:#f3f0ec;border-radius:11px;padding:10px 13px;margin-bottom:14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>
              </svg>
              <input
                v-model="customerSearch"
                placeholder="Search name or phone…"
                style="border:none;background:transparent;outline:none;font:inherit;font-size:13px;color:#5b6472;width:100%;"
                @focus="showCustomerDropdown = true"
                @blur="hideDropdown"
              />
            </div>
            <!-- Dropdown -->
            <div
              v-if="showCustomerDropdown && filteredCustomers.length"
              style="position:absolute;top:50px;left:0;right:0;background:#fff;border:1px solid #ece8e3;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);z-index:10;overflow:hidden;"
            >
              <button
                v-for="c in filteredCustomers"
                :key="c.id"
                @mousedown.prevent="selectCustomer(c)"
                style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border:none;background:transparent;font:inherit;font-size:13px;cursor:pointer;text-align:left;"
              >
                <div style="width:30px;height:30px;border-radius:8px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex:none;">
                  {{ initials(c.name) }}
                </div>
                <div>
                  <div style="font-weight:600;color:#222831;">{{ c.name }}</div>
                  <div style="font-size:11.5px;color:#9aa1ab;">{{ c.phone }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Selected customer card -->
          <div v-if="selectedCustomer" style="border:1px solid #FBD9C2;background:#FEF1E9;border-radius:13px;padding:15px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:46px;height:46px;border-radius:13px;background:#F26F21;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:none;">
                {{ initials(selectedCustomer.name) }}
              </div>
              <div style="min-width:0;">
                <div style="font-size:15px;font-weight:700;">{{ selectedCustomer.name }}</div>
                <div style="font-size:12.5px;color:#8a7a6e;">{{ selectedCustomer.phone }}</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <div style="flex:1;background:#fff;border-radius:9px;padding:9px 11px;">
                <div style="font-size:11px;color:#9aa1ab;font-weight:600;">Member since</div>
                <div style="font-size:13px;font-weight:700;margin-top:1px;">{{ memberSince(selectedCustomer.created_at) }}</div>
              </div>
              <div style="flex:1;background:#fff;border-radius:9px;padding:9px 11px;">
                <div style="font-size:11px;color:#9aa1ab;font-weight:600;">Lifetime</div>
                <div style="font-size:13px;font-weight:700;margin-top:1px;">{{ selectedCustomer.total_orders ?? 0 }} orders</div>
              </div>
            </div>
          </div>

          <!-- New customer button -->
          <button
            @click="router.push('/customers/new')"
            style="margin-top:13px;width:100%;border:1px dashed #d8d2ca;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13px;padding:11px;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New customer
          </button>
        </div>
      </div>

      <!-- MIDDLE: Catalog grid -->
      <div style="flex:1;min-width:0;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px 22px;">
        <!-- Service tabs + title -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
          <div style="font-size:15px;font-weight:700;">Add items</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button
              v-for="tab in serviceTabs"
              :key="tab.key"
              @click="serviceTab = tab.key"
              :style="{
                border: serviceTab === tab.key ? '1px solid #FBD9C2' : '1px solid #ece8e3',
                background: serviceTab === tab.key ? '#FEF1E9' : '#fff',
                color: serviceTab === tab.key ? '#D85D14' : '#5b6472',
                font: 'inherit',
                fontWeight: '600',
                fontSize: '12.5px',
                padding: '7px 13px',
                borderRadius: '9px',
                cursor: 'pointer',
              }"
            >{{ tab.label }}</button>
          </div>
        </div>

        <!-- 4-column catalog grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
          <button
            v-for="item in catalog"
            :key="item.slug"
            @click="addItem(item)"
            style="display:flex;align-items:center;gap:11px;border:1px solid #ece8e3;background:#fff;border-radius:13px;padding:12px;cursor:pointer;text-align:left;font:inherit;transition:border-color 0.15s,background 0.15s;"
            @mouseenter="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.borderColor = '#F26F21'; (e.currentTarget as HTMLElement).style.background = '#FEF1E9' }"
            @mouseleave="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.borderColor = '#ece8e3'; (e.currentTarget as HTMLElement).style.background = '#fff' }"
          >
            <div style="width:38px;height:38px;border-radius:10px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex:none;">
              {{ letterFor(item.name) }}
            </div>
            <div style="min-width:0;">
              <div style="font-size:13.5px;font-weight:700;">{{ item.name }}</div>
              <div style="font-size:12px;color:#9aa1ab;font-weight:600;">K{{ item.base_price.toFixed(2) }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- RIGHT: Order summary -->
      <div style="width:340px;flex:none;background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="font-size:15px;font-weight:700;">Order summary</div>
          <div style="font-size:12px;color:#9aa1ab;font-weight:600;">{{ itemCount }}</div>
        </div>

        <!-- Line items -->
        <div style="display:flex;flex-direction:column;gap:4px;margin:12px 0;max-height:240px;overflow:auto;">
          <div
            v-for="item in orderItems"
            :key="item.key"
            style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f6f3ef;"
          >
            <div style="flex:1;min-width:0;">
              <div style="font-size:13.5px;font-weight:700;">{{ item.name }}</div>
              <div style="font-size:11.5px;color:#9aa1ab;">{{ serviceTabs.find(t => t.key === serviceTab)?.label }} · K{{ item.price.toFixed(2) }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex:none;">
              <button @click="changeQty(item.key, -1)" style="width:24px;height:24px;border-radius:7px;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
              <span style="font-size:13px;font-weight:700;width:16px;text-align:center;">{{ item.qty }}</span>
              <button @click="changeQty(item.key, 1)" style="width:24px;height:24px;border-radius:7px;border:1px solid #FBD9C2;background:#FEF1E9;color:#D85D14;font:inherit;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
            </div>
            <div style="width:54px;text-align:right;font-size:13.5px;font-weight:700;flex:none;">
              K{{ (item.price * item.qty).toFixed(2) }}
            </div>
          </div>
          <div v-if="orderItems.length === 0" style="text-align:center;color:#bbb;font-size:13px;padding:20px 0;">
            Tap a catalog item to add it
          </div>
        </div>

        <!-- Totals -->
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13.5px;padding-top:6px;">
          <div style="display:flex;justify-content:space-between;color:#5b6472;">
            <span>Subtotal</span>
            <span style="font-weight:600;color:#222831;">K{{ subtotal.toFixed(2) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#5b6472;">
            <span>Tax (7.5%)</span>
            <span style="font-weight:600;color:#222831;">K{{ taxAmount.toFixed(2) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ece8e3;padding-top:11px;margin-top:3px;">
            <span style="font-size:15px;font-weight:700;">Total</span>
            <span style="font-size:21px;font-weight:800;color:#F26F21;">K{{ total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment method -->
        <div style="font-size:12px;font-weight:700;letter-spacing:0.3px;color:#aab0ba;margin:16px 0 9px;">PAYMENT</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button
            v-for="opt in paymentOpts"
            :key="opt.key"
            @click="paymentMethod = opt.key as any"
            :style="{
              border: paymentMethod === opt.key ? '1px solid #FBD9C2' : '1px solid #ece8e3',
              background: paymentMethod === opt.key ? '#FEF1E9' : '#fff',
              color: paymentMethod === opt.key ? '#D85D14' : '#5b6472',
              font: 'inherit',
              fontWeight: '700',
              fontSize: '13px',
              padding: '11px',
              borderRadius: '11px',
              cursor: 'pointer',
            }"
          >{{ opt.label }}</button>
        </div>

        <p v-if="error" style="font-size:12.5px;color:#d6453d;margin:10px 0 0;background:#fdeceb;border-radius:8px;padding:9px 12px;">{{ error }}</p>

        <!-- Actions -->
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button
            @click="router.back()"
            style="flex:none;width:46px;border:1px solid #ece8e3;background:#fff;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;"
            title="Cancel"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5b6472" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <button
            @click="submit"
            :disabled="submitting"
            style="flex:1;border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:13px;border-radius:12px;cursor:pointer;box-shadow:0 10px 20px -10px #F26F21;"
            :style="submitting ? { opacity: '0.7', cursor: 'not-allowed' } : {}"
          >
            {{ submitting ? 'Creating…' : 'Confirm order' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
