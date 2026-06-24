<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;background:#F26F21;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;">
    <div style="background:#ffffff;border-radius:24px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 24px 64px -12px rgba(242,111,33,0.35);">

      <!-- Logo -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:32px;">
        <div style="width:64px;height:64px;border-radius:18px;background:#F26F21;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 24px -8px #F26F21;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2.5s6.5 6.8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 9.3 12 2.5 12 2.5z"/>
          </svg>
        </div>
        <div style="text-align:center;">
          <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;">
            Wash<span style="color:#F26F21;">Point</span>
          </div>
          <div style="font-size:13px;color:#9aa1ab;margin-top:3px;font-weight:500;">Staff &amp; Admin Portal</div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">
            Email <span style="color:#F26F21;">*</span>
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="admin@laundry.local"
            required
            autocomplete="email"
            style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;transition:border-color 0.15s;"
            @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
            @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
          />
        </div>
        <div>
          <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">
            Password <span style="color:#F26F21;">*</span>
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
            style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;transition:border-color 0.15s;"
            @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
            @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
          />
        </div>

        <p v-if="error" style="font-size:13px;color:#d6453d;background:#fdeceb;border-radius:9px;padding:10px 13px;margin:0;">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          style="width:100%;border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:15px;padding:14px;border-radius:13px;cursor:pointer;box-shadow:0 10px 24px -8px #F26F21;margin-top:4px;transition:opacity 0.15s;"
          :style="loading ? { opacity: '0.7', cursor: 'not-allowed' } : {}"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>

    <!-- Footer -->
    <div style="position:fixed;bottom:20px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:8px;">
      <img src="/hexaprime-light.png" alt="HexaPrime Solutions" style="height:18px;width:18px;object-fit:contain;" />
      <span style="font-size:12px;color:rgba(255,255,255,0.75);font-weight:500;">
        A product of <span style="color:#fff;font-weight:700;">HexaPrime Solutions</span>
      </span>
    </div>
  </div>
</template>
