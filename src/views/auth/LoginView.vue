<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  <div style="min-height:100vh;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;">
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
          <div style="position:relative;">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 44px 12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;transition:border-color 0.15s;"
              @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
              @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
              style="position:absolute;top:50%;right:8px;transform:translateY(-50%);border:none;background:none;padding:6px;cursor:pointer;color:#9aa1ab;display:flex;align-items:center;justify-content:center;"
            >
              <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.5 13.5 0 0 0 2 11s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
              </svg>
            </button>
          </div>
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
      <span style="font-size:12px;color:rgba(0,0,0,0.5);font-weight:500;">
        A product of <span style="color:#000;font-weight:700;">HexaPrime Solutions</span>
      </span>
    </div>
  </div>
</template>
