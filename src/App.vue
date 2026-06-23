<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const showSidebar = computed(() => route.name !== 'login' && auth.isAuthenticated)
</script>

<template>
  <SidebarProvider v-if="showSidebar">
    <AppSidebar />
    <SidebarInset>
      <router-view />
    </SidebarInset>
  </SidebarProvider>
  <router-view v-else />
</template>
