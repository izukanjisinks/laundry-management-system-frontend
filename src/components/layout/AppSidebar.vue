<script setup lang="ts">
import {
  LayoutDashboard,
  Settings2,
  ShoppingBag,
  Users,
  Users2,
} from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import NavDocuments from './NavDocuments.vue'
import NavMain from './NavMain.vue'
import NavSecondary from './NavSecondary.vue'
import NavUser from './NavUser.vue'
import SidebarLogo from './SidebarLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const auth = useAuthStore()

const navMain = computed(() => {
  const items = [
    {
      title: 'Orders',
      url: '/orders',
      icon: ShoppingBag,
      isActive: true,
      items: [
        { title: 'All Orders', url: '/orders' },
        { title: 'New Order', url: '/orders/new' },
      ],
    },
    {
      title: 'Customers',
      url: '/customers',
      icon: Users2,
      items: [
        { title: 'All Customers', url: '/customers' },
        { title: 'New Customer', url: '/customers/new' },
      ],
    },
  ]

  if (auth.isAdmin) {
    items.push({
      title: 'Staff',
      url: '/admin/staff',
      icon: Users,
      items: [{ title: 'Manage Staff', url: '/admin/staff' }],
    })
  }

  return items
})

const navSecondary = [
  { title: 'Settings', url: '/settings', icon: Settings2 },
]

const quickLinks = computed(() => {
  const links = [
    { name: 'Orders', url: '/orders', icon: ShoppingBag },
    { name: 'Customers', url: '/customers', icon: Users2 },
  ]
  if (auth.isAdmin) {
    links.push({ name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard })
  }
  return links
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarLogo />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavDocuments :items="quickLinks" />
      <NavSecondary :items="navSecondary" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

