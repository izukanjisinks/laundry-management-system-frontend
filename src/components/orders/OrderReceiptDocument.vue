<script setup lang="ts">
import { Document, Page, View, Text } from '@ceereals/vue-pdf'
import type { Style } from '@ceereals/vue-pdf'
import type { Order } from '@/types'

const props = defineProps<{ order: Order }>()

function fmt(n: number) {
  return `K ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

const serviceLabels: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  dry_clean: 'Dry Clean',
  ironing: 'Ironing',
  wash_iron: 'Wash & Iron',
}

const paymentLabels: Record<string, string> = {
  unpaid: 'UNPAID',
  partial: 'PARTIAL',
  paid: 'PAID',
}

const paymentColors: Record<string, string> = {
  unpaid: '#d6453d',
  partial: '#d77a18',
  paid: '#1f9d57',
}

const s: Record<string, Style> = {
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#F26F21' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#F26F21' },
  brandSub: { fontSize: 9, color: '#9aa1ab', marginTop: 4 },
  receiptTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: '#1a1a1a' },
  orderNumber: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 4 },
  statusBadge: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },

  metaRow: { flexDirection: 'row', marginBottom: 24, gap: 16 },
  metaBox: { flex: 1, backgroundColor: '#faf8f6', padding: 12, borderRadius: 4 },
  metaLabel: { fontSize: 8, color: '#9aa1ab', textTransform: 'uppercase', marginBottom: 5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  metaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 2 },
  metaSmall: { fontSize: 9, color: '#6b7280', marginTop: 2 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#222831', padding: 9, borderRadius: 4, marginBottom: 1 },
  thText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 9, borderBottomWidth: 1, borderBottomColor: '#f5f4f2' },
  tableRowAlt: { flexDirection: 'row', padding: 9, backgroundColor: '#faf8f6', borderBottomWidth: 1, borderBottomColor: '#f5f4f2' },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: 'center' },
  colPrice: { width: 90, textAlign: 'right' },
  colTotal: { width: 90, textAlign: 'right' },

  totalsSection: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', gap: 12 },
  subtotalsBlock: { flexDirection: 'column', justifyContent: 'center', gap: 4 },
  totalRow: { flexDirection: 'row', paddingVertical: 3 },
  totalLabel: { width: 110, textAlign: 'right', paddingRight: 16, color: '#6b7280' },
  totalValue: { width: 90, textAlign: 'right' },
  totalBold: { width: 90, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  grandRow: { flexDirection: 'column', backgroundColor: '#F26F21', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4, justifyContent: 'center', alignItems: 'flex-end' },
  grandLabel: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4, opacity: 0.8 },
  grandValue: { color: '#ffffff', fontSize: 16, fontFamily: 'Helvetica-Bold' },

  notesSection: { marginTop: 24, padding: 12, backgroundColor: '#faf8f6', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#F26F21' },
  notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#9aa1ab', textTransform: 'uppercase', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#57534e', lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 30, left: 48, right: 48, borderTopWidth: 1, borderTopColor: '#ece8e3', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#b0b8c4' },
}
</script>

<template>
  <Document :title="`Receipt WP-${order.order_number}`">
    <Page size="A4" :style="s.page">

      <!-- Header -->
      <View :style="s.header">
        <View>
          <Text :style="s.brandName">WashPoint</Text>
          <Text :style="s.brandSub">Laundry &amp; Dry Cleaning Services</Text>
        </View>
        <View>
          <Text :style="s.receiptTitle">RECEIPT</Text>
          <Text :style="s.orderNumber">WP-{{ order.order_number }}</Text>
          <View :style="[s.statusBadge, { backgroundColor: paymentColors[order.payment_status] ?? '#6b7280' }]">
            <Text :style="s.statusText">{{ paymentLabels[order.payment_status] ?? order.payment_status.toUpperCase() }}</Text>
          </View>
        </View>
      </View>

      <!-- Bill To + Order Info -->
      <View :style="s.metaRow">
        <View :style="s.metaBox">
          <Text :style="s.metaLabel">Customer</Text>
          <Text :style="s.metaValue">{{ order.customer?.name ?? '—' }}</Text>
          <Text v-if="order.customer?.phone" :style="s.metaSmall">{{ order.customer.phone }}</Text>
          <Text v-if="order.customer?.email" :style="s.metaSmall">{{ order.customer.email }}</Text>
        </View>
        <View :style="s.metaBox">
          <Text :style="s.metaLabel">Order Info</Text>
          <Text :style="s.metaSmall">Service: <Text :style="{ fontFamily: 'Helvetica-Bold' }">{{ serviceLabels[order.service_type] ?? order.service_type }}</Text></Text>
          <Text :style="[s.metaSmall, { marginTop: 3 }]">Received: <Text :style="{ fontFamily: 'Helvetica-Bold' }">{{ fmtDate(order.received_at) }}</Text></Text>
          <Text v-if="order.due_at" :style="[s.metaSmall, { marginTop: 3 }]">Due: <Text :style="{ fontFamily: 'Helvetica-Bold' }">{{ fmtDate(order.due_at) }}</Text></Text>
          <Text v-if="order.picked_up_at" :style="[s.metaSmall, { marginTop: 3, color: '#1f9d57' }]">Collected: <Text :style="{ fontFamily: 'Helvetica-Bold' }">{{ fmtDate(order.picked_up_at) }}</Text></Text>
        </View>
      </View>

      <!-- Line items table -->
      <View :style="s.tableHeader">
        <Text :style="[s.thText, s.colDesc]">Item</Text>
        <Text :style="[s.thText, s.colQty]">Qty</Text>
        <Text :style="[s.thText, s.colPrice]">Unit Price</Text>
        <Text :style="[s.thText, s.colTotal]">Total</Text>
      </View>
      <View
        v-for="(item, i) in order.items"
        :key="i"
        :style="i % 2 === 0 ? s.tableRow : s.tableRowAlt"
      >
        <Text :style="s.colDesc">{{ item.name }}</Text>
        <Text :style="[s.colQty, { fontSize: 9, color: '#6b7280' }]">{{ item.qty }}</Text>
        <Text :style="s.colPrice">{{ fmt(item.price) }}</Text>
        <Text :style="s.colTotal">{{ fmt(item.price * item.qty) }}</Text>
      </View>

      <!-- Totals -->
      <View :style="s.totalsSection">
        <View :style="s.subtotalsBlock">
          <View :style="s.totalRow">
            <Text :style="s.totalLabel">Subtotal</Text>
            <Text :style="s.totalBold">{{ fmt(order.subtotal) }}</Text>
          </View>
          <View :style="s.totalRow">
            <Text :style="s.totalLabel">Tax ({{ Math.round((order.tax_rate ?? 0.075) * 100) }}%)</Text>
            <Text :style="s.totalValue">{{ fmt(order.tax_amount) }}</Text>
          </View>
        </View>
        <View :style="s.grandRow">
          <Text :style="s.grandLabel">Total</Text>
          <Text :style="s.grandValue">{{ fmt(order.total_price) }}</Text>
        </View>
      </View>

      <!-- Notes -->
      <View v-if="order.notes" :style="s.notesSection">
        <Text :style="s.notesLabel">Notes</Text>
        <Text :style="s.notesText">{{ order.notes }}</Text>
      </View>

      <!-- Footer -->
      <View :style="s.footer" fixed>
        <Text :style="s.footerText">WashPoint — WP-{{ order.order_number }}</Text>
        <Text :style="s.footerText">Thank you for choosing WashPoint.</Text>
      </View>

    </Page>
  </Document>
</template>
