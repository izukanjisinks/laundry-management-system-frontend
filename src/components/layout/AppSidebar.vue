<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function isActive(path: string) {
  if (path === '/orders/new') return route.path === '/orders/new'
  if (path === '/orders/all') return route.path === '/orders/all'
  if (path === '/orders') return route.path === '/orders'
  if (path === '/dashboard') return route.path === '/dashboard'
  if (path === '/customers') return route.path.startsWith('/customers')
  if (path === '/admin/staff') return route.path.startsWith('/admin')
  return false
}

function navStyle(path: string) {
  const active = isActive(path)
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '11px 13px',
    border: 'none',
    borderRadius: '12px',
    font: 'inherit',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    background: active ? '#FEF1E9' : 'transparent',
    color: active ? '#D85D14' : '#5b6472',
    boxShadow: active ? 'inset 0 0 0 1px #FBD9C2' : 'none',
  }
}


</script>

<template>
  <aside style="width:256px;flex:none;background:#ffffff;border-right:1px solid #ece8e3;display:flex;flex-direction:column;padding:22px 18px;height:100vh;overflow-y:auto;">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:11px;padding:4px 6px 22px 6px;">
      <div style="width:40px;height:40px;border-radius:12px;background:#F26F21;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px -8px #F26F21;flex:none;">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 2.5s6.5 6.8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 9.3 12 2.5 12 2.5z"/>
        </svg>
      </div>
      <div style="font-size:19px;font-weight:800;letter-spacing:-0.4px;">
        Wash<span style="color:#F26F21;">Point</span>
      </div>
    </div>

    <!-- WORKFLOW section -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:#aab0ba;padding:6px 8px 8px;">WORKFLOW</div>
    <nav style="display:flex;flex-direction:column;gap:4px;">
      <button @click="router.push('/dashboard')" :style="navStyle('/dashboard')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/>
          <rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>
        </svg>
        Dashboard
      </button>
      <button @click="router.push('/orders/new')" :style="navStyle('/orders/new')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
        </svg>
        New Order
      </button>
      <button @click="router.push('/orders')" :style="navStyle('/orders')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 4v4h-4"/>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 20v-4h4"/>
        </svg>
        Processing
      </button>
      <button @click="router.push('/orders/all')" :style="navStyle('/orders/all')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>
        </svg>
        All Orders
      </button>
      <button @click="router.push('/pickup')" :style="navStyle('/pickup')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 7.5h12l-1 12.5H7L6 7.5z"/><path d="M9 7.5a3 3 0 0 1 6 0"/>
          <path d="M9.3 13.6l2 2 3.4-3.6"/>
        </svg>
        Pickup
      </button>
    </nav>

    <!-- MANAGE section -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:#aab0ba;padding:22px 8px 8px;">MANAGE</div>
    <nav style="display:flex;flex-direction:column;gap:4px;">
      <button @click="router.push('/customers')" :style="navStyle('/customers')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/>
          <path d="M16 5.6a3 3 0 0 1 0 5.8"/><path d="M21 20a5.5 5.5 0 0 0-4-5.3"/>
        </svg>
        Customers
      </button>
      <button v-if="auth.isAdmin" @click="router.push('/admin/staff')" :style="navStyle('/admin/staff')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/>
          <path d="M16 5.6a3 3 0 0 1 0 5.8"/><path d="M21 20a5.5 5.5 0 0 0-4-5.3"/>
        </svg>
        Users
      </button>
      <div style="display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:12px;font-weight:600;font-size:14px;color:#aeb4bd;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="7" x2="20" y2="7"/><circle cx="15" cy="7" r="2.3" fill="currentColor"/>
          <line x1="4" y1="13" x2="20" y2="13"/><circle cx="8" cy="13" r="2.3" fill="currentColor"/>
          <line x1="4" y1="19" x2="20" y2="19"/><circle cx="16" cy="19" r="2.3" fill="currentColor"/>
        </svg>
        Settings
      </div>
    </nav>

    <!-- Printer promo card (bottom) -->
    <div style="margin-top:auto;background:#F26F21;border-radius:16px;padding:18px 16px;color:#fff;overflow:hidden;position:relative;">
      <div style="font-size:14px;font-weight:700;line-height:1.3;">Need a new tag printer?</div>
      <div style="font-size:12px;opacity:0.9;margin-top:5px;line-height:1.45;">Connect a thermal printer to auto-tag every garment.</div>
      <button style="margin-top:12px;border:none;background:#fff;color:#D85D14;font:inherit;font-weight:700;font-size:12px;padding:7px 14px;border-radius:9px;cursor:pointer;">Set up</button>
    </div>
  </aside>
</template>
