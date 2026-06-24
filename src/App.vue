<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const route = useRoute()
const auth = useAuthStore()

const showSidebar = computed(() => route.name !== 'login' && auth.isAuthenticated)
</script>

<template>
  <div style="display:flex;height:100vh;width:100%;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;background:#f6f4f1;color:#222831;">
    <AppSidebar v-if="showSidebar" />
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;">
      <router-view />
    </div>
  </div>
</template>
