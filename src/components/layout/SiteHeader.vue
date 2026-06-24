<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

defineProps<{ title: string }>()

const auth = useAuthStore()
const router = useRouter()

function initials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header style="height:72px;flex:none;background:#ffffff;border-bottom:1px solid #ece8e3;display:flex;align-items:center;gap:18px;padding:0 28px;">
    <h1 style="font-size:21px;font-weight:800;letter-spacing:-0.4px;margin:0;flex:none;">{{ title }}</h1>

    <!-- Search bar -->
    <div style="flex:1;display:flex;justify-content:flex-end;">
      <div style="display:flex;align-items:center;gap:10px;background:#f3f0ec;border-radius:11px;padding:9px 14px;width:300px;max-width:38vw;">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>
        </svg>
        <input
          placeholder="Search orders, customers…"
          style="border:none;background:transparent;outline:none;font:inherit;font-size:13.5px;color:#5b6472;width:100%;"
        />
      </div>
    </div>

    <!-- Bell -->
    <button style="width:42px;height:42px;border-radius:12px;border:1px solid #ece8e3;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;flex:none;">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5b6472" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/>
        <path d="M13.5 20a2 2 0 0 1-3 0"/>
      </svg>
      <span style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:#F26F21;border:2px solid #fff;"></span>
    </button>

    <!-- User avatar -->
    <div style="display:flex;align-items:center;gap:11px;flex:none;padding-left:6px;">
      <button
        @click="logout"
        style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#3a4250,#5b6472);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;"
        :title="`Logout ${auth.user?.full_name}`"
      >
        {{ auth.user ? initials(auth.user.full_name) : 'U' }}
      </button>
      <div style="line-height:1.2;">
        <div style="font-size:13.5px;font-weight:700;">{{ auth.user?.full_name }}</div>
        <div style="font-size:11.5px;color:#9aa1ab;text-transform:capitalize;">{{ auth.user?.role?.name }}</div>
      </div>
    </div>
  </header>
</template>
