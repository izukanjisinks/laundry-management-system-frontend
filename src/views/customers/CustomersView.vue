<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Customer } from '@/types'

const router = useRouter()
const customers = ref<Customer[]>([])
const loading = ref(true)
const search = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function fetchCustomers(q = '') {
  loading.value = true
  try {
    const { data } = await customersApi.list(q || undefined)
    customers.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchCustomers())

watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchCustomers(val), 300)
})

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function memberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="Customers" />

    <div style="flex:1;overflow:auto;padding:26px 28px;">

      <!-- Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;background:#f3f0ec;border-radius:11px;padding:9px 14px;width:280px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>
          </svg>
          <input
            v-model="search"
            placeholder="Search name or phone…"
            style="border:none;background:transparent;outline:none;font:inherit;font-size:13.5px;color:#5b6472;width:100%;"
          />
        </div>
        <button
          @click="router.push('/customers/new')"
          style="border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:13px;padding:10px 16px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:7px;"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New customer
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align:center;color:#9aa1ab;font-size:14px;padding:40px 0;">Loading…</div>

      <!-- Table -->
      <div v-else style="background:#fff;border:1px solid #ece8e3;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.8fr 0.7fr;font-size:11px;font-weight:700;letter-spacing:0.4px;color:#aab0ba;padding:14px 20px;border-bottom:1px solid #f1eeea;">
          <div>NAME</div><div>PHONE</div><div>EMAIL</div><div>ORDERS</div><div>SINCE</div>
        </div>

        <!-- Rows -->
        <div
          v-for="c in customers"
          :key="c.id"
          @click="router.push(`/customers/${c.id}`)"
          style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.8fr 0.7fr;align-items:center;padding:14px 20px;border-bottom:1px solid #f6f3ef;cursor:pointer;transition:background 0.1s;"
          @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')"
          @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <div style="display:flex;align-items:center;gap:11px;">
            <div style="width:34px;height:34px;border-radius:10px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:none;">
              {{ initials(c.name) }}
            </div>
            <span style="font-size:14px;font-weight:700;">{{ c.name }}</span>
          </div>
          <div style="font-size:13.5px;color:#5b6472;">{{ c.phone }}</div>
          <div style="font-size:13.5px;color:#5b6472;">{{ c.email || '—' }}</div>
          <div style="font-size:13.5px;font-weight:700;">{{ c.total_orders ?? 0 }}</div>
          <div style="font-size:13px;color:#9aa1ab;">{{ memberSince(c.created_at) }}</div>
        </div>

        <!-- Empty -->
        <div v-if="customers.length === 0" style="text-align:center;color:#9aa1ab;font-size:14px;padding:40px 0;">
          No customers found
        </div>
      </div>
    </div>
  </div>
</template>
