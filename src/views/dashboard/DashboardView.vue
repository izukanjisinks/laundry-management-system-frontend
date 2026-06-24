<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { reportsApi } from '@/api/reports'
import { ordersApi } from '@/api/orders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { ReportSummary, DailyCount, Order } from '@/types'

const router = useRouter()
const summary = ref<ReportSummary | null>(null)
const readyOrders = ref<Order[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [summaryRes, readyRes] = await Promise.all([
      reportsApi.summary(),
      ordersApi.list('ready'),
    ])
    summary.value = summaryRes.data.data
    readyOrders.value = readyRes.data.data ?? []
  } finally {
    loading.value = false
  }
})

function initials(name: string) {
  return name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
}

// Build SVG area chart path from daily_orders
const chartPath = computed(() => {
  const data: DailyCount[] = summary.value?.daily_orders ?? []
  if (data.length < 2) return { area: '', line: '', peakX: 0, peakY: 0 }
  const W = 660
  const H = 180
  const pad = 10
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - (d.count / maxCount) * (H - pad * 2),
    count: d.count,
  }))
  // Build smooth cubic bezier path through points
  function smooth(points: { x: number; y: number }[]) {
    if (points.length < 2) return ''
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const tension = 0.4
      const cpx = prev.x + (curr.x - prev.x) * tension
      const cpy = prev.y
      const cpx2 = curr.x - (curr.x - prev.x) * tension
      const cpy2 = curr.y
      d += ` C${cpx.toFixed(1)},${cpy.toFixed(1)} ${cpx2.toFixed(1)},${cpy2.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
    }
    return d
  }
  const line = smooth(pts)
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`
  const peak = pts.reduce((a, b) => (b.count > a.count ? b : a), pts[0])
  return { area, line, peakX: peak.x, peakY: peak.y }
})

const dayLabels = computed(() => {
  const data = summary.value?.daily_orders ?? []
  return data.map((d) => {
    const date = new Date(d.day + 'T00:00:00')
    return date.toLocaleDateString('en', { weekday: 'short' })
  })
})

const inProcess = computed(() => {
  if (!summary.value) return 0
  const s = summary.value.orders_by_status
  return (s.received ?? 0) + (s.washing ?? 0)
})
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="Dashboard" />

    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa1ab;font-size:14px;">
      Loading…
    </div>

    <div v-else-if="summary" style="flex:1;overflow:auto;padding:26px 28px;">

      <!-- 4 KPI cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;">

        <!-- Orders today -->
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="width:38px;height:38px;border-radius:11px;background:#FEF1E9;display:flex;align-items:center;justify-content:center;">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D85D14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h6"/>
              </svg>
            </div>
          </div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:14px;">{{ summary.total_orders }}</div>
          <div style="font-size:13px;color:#9aa1ab;font-weight:500;margin-top:2px;">Total orders</div>
        </div>

        <!-- In process -->
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="width:38px;height:38px;border-radius:11px;background:#e7f6f8;display:flex;align-items:center;justify-content:center;">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0e8a93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8"/><path d="M12 12l3 2"/><path d="M12 4v2M20 12h-2"/>
              </svg>
            </div>
            <span style="font-size:12px;font-weight:700;color:#0e8a93;background:#e7f6f8;padding:3px 8px;border-radius:7px;">live</span>
          </div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:14px;">{{ inProcess }}</div>
          <div style="font-size:13px;color:#9aa1ab;font-weight:500;margin-top:2px;">In process</div>
        </div>

        <!-- Ready for pickup -->
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="width:38px;height:38px;border-radius:11px;background:#e8f7ee;display:flex;align-items:center;justify-content:center;">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1f9d57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <span style="font-size:12px;font-weight:700;color:#1f9d57;background:#e8f7ee;padding:3px 8px;border-radius:7px;">ready</span>
          </div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:14px;">{{ summary.orders_by_status.ready ?? 0 }}</div>
          <div style="font-size:13px;color:#9aa1ab;font-weight:500;margin-top:2px;">Ready for pickup</div>
        </div>

        <!-- Revenue -->
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="width:38px;height:38px;border-radius:11px;background:#FEF1E9;display:flex;align-items:center;justify-content:center;">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D85D14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>
              </svg>
            </div>
          </div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:14px;">K{{ summary.today_revenue.toFixed(2) }}</div>
          <div style="font-size:13px;color:#9aa1ab;font-weight:500;margin-top:2px;">Today's revenue</div>
        </div>
      </div>

      <div style="display:flex;gap:18px;margin-top:18px;align-items:stretch;">

        <!-- Left column: chart + workload -->
        <div style="flex:1.7;min-width:0;display:flex;flex-direction:column;gap:18px;">

          <!-- Orders this week chart -->
          <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px 22px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div>
                <div style="font-size:16px;font-weight:700;">Orders this week</div>
                <div style="font-size:12.5px;color:#9aa1ab;margin-top:2px;">
                  {{ summary.daily_orders.reduce((a, d) => a + d.count, 0) }} orders
                </div>
              </div>
            </div>
            <svg viewBox="0 0 660 200" preserveAspectRatio="none" style="width:100%;height:200px;display:block;overflow:visible;">
              <line x1="0" y1="60" x2="660" y2="60" stroke="#f1eeea" stroke-width="1"/>
              <line x1="0" y1="110" x2="660" y2="110" stroke="#f1eeea" stroke-width="1"/>
              <line x1="0" y1="160" x2="660" y2="160" stroke="#f1eeea" stroke-width="1"/>
              <path :d="chartPath.area" fill="#F26F21" fill-opacity="0.12"/>
              <path :d="chartPath.line" fill="none" stroke="#F26F21" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle :cx="chartPath.peakX" :cy="chartPath.peakY" r="5.5" fill="#F26F21" stroke="#fff" stroke-width="2.5"/>
            </svg>
            <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#aab0ba;font-weight:600;">
              <span v-for="label in dayLabels" :key="label">{{ label }}</span>
            </div>
          </div>

          <!-- Workload bars -->
          <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px 22px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:16px;">Today's workload</div>
            <div style="display:flex;flex-direction:column;gap:15px;">
              <div v-for="item in [
                { label: 'Received', count: summary.orders_by_status.received ?? 0, color: '#4154d6', bg: '#eef2ff' },
                { label: 'Washing', count: summary.orders_by_status.washing ?? 0, color: '#0e8a93', bg: '#e7f6f8' },
                { label: 'Ready', count: summary.orders_by_status.ready ?? 0, color: '#1f9d57', bg: '#e8f7ee' },
                { label: 'Collected', count: summary.orders_by_status.picked_up ?? 0, color: '#6b7280', bg: '#eef0f2' },
              ]" :key="item.label">
                <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:7px;">
                  <span>{{ item.label }}</span>
                  <span style="color:#9aa1ab;">{{ item.count }}</span>
                </div>
                <div style="height:8px;border-radius:6px;background:#f1eeea;overflow:hidden;">
                  <div :style="{
                    height: '100%',
                    borderRadius: '6px',
                    width: summary.total_orders > 0 ? Math.round((item.count / summary.total_orders) * 100) + '%' : '0%',
                    background: item.color,
                  }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column: ready for pickup -->
        <div style="width:420px;flex:none;display:flex;flex-direction:column;gap:18px;">
          <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div style="font-size:16px;font-weight:700;">Ready for pickup</div>
              <button @click="router.push('/pickup')" style="border:none;background:transparent;font:inherit;font-size:12.5px;font-weight:700;color:#F26F21;cursor:pointer;">View all</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div
                v-for="o in readyOrders"
                :key="o.id"
                @click="router.push(`/orders/${o.id}`)"
                style="display:flex;align-items:center;gap:11px;padding:10px 12px;border:1px solid #ece8e3;border-radius:12px;cursor:pointer;"
                @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')"
                @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#fff')"
              >
                <div style="width:36px;height:36px;border-radius:10px;background:#e8f7ee;color:#1f9d57;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;flex:none;">
                  {{ initials(o.customer?.name ?? '') }}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ o.customer?.name ?? '—' }}</div>
                  <div style="font-size:11.5px;color:#9aa1ab;">WP-{{ o.order_number }} · {{ o.items.reduce((a, b) => a + b.qty, 0) }} items</div>
                </div>
                <div style="font-size:13px;font-weight:700;flex:none;">K{{ Number(o.total_price).toFixed(2) }}</div>
              </div>
              <div v-if="readyOrders.length === 0" style="color:#9aa1ab;font-size:13px;text-align:center;padding:20px 0;">
                No orders ready for pickup
              </div>
            </div>
          </div>

          <!-- Unpaid orders card -->
          <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:20px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:14px;">Unpaid orders</div>
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:48px;height:48px;border-radius:13px;background:#fdeceb;display:flex;align-items:center;justify-content:center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d6453d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>
                </svg>
              </div>
              <div>
                <div style="font-size:28px;font-weight:800;color:#d6453d;">{{ summary.unpaid_orders }}</div>
                <div style="font-size:13px;color:#9aa1ab;font-weight:500;">orders need payment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

