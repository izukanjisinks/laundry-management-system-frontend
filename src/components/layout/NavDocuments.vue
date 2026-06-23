<script setup lang="ts">
import { MoreHorizontal, type LucideIcon } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

defineProps<{ items: NavItem[] }>()

const { isMobile } = useSidebar()
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in items" :key="item.name">
        <SidebarMenuButton as-child>
          <router-link :to="item.url">
            <component :is="item.icon" />
            <span>{{ item.name }}</span>
          </router-link>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuAction show-on-hover>
              <MoreHorizontal />
              <span class="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-48"
            :side="isMobile ? 'bottom' : 'right'"
            align="end"
          >
            <DropdownMenuItem>
              <span>Open</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>

