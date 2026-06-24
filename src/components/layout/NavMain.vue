<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  url: string
  icon?: any
  isActive?: boolean
  items?: { title: string; url: string }[]
}

defineProps<{ items: NavItem[] }>()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel class="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-semibold px-2 mb-1">
      Navigation
    </SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isActive"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton
              :tooltip="item.title"
              class="rounded-xl font-semibold text-[14px] transition-all hover:bg-accent hover:text-accent-foreground"
              :class="item.isActive ? 'bg-primary/10 text-primary border border-primary/10' : 'text-muted-foreground'"
            >
              <component :is="item.icon" v-if="item.icon" class="size-4" />
              <span>{{ item.title }}</span>
              <ChevronRight
                class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="sub in item.items" :key="sub.title">
                <SidebarMenuSubButton as-child class="text-[13px] text-muted-foreground hover:text-foreground">
                  <router-link :to="sub.url">
                    <span>{{ sub.title }}</span>
                  </router-link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
