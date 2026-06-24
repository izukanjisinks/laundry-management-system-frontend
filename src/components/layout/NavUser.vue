<script setup lang="ts">
import { Bell, ChevronsUpDown, LogOut, Settings } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const { isMobile } = useSidebar()
const auth = useAuthStore()
const router = useRouter()

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="rounded-2xl border border-border/30 bg-accent/40 hover:bg-accent transition-all data-[state=open]:bg-accent"
          >
            <Avatar class="h-9 w-9 rounded-xl border border-primary/20 shadow-sm">
              <AvatarFallback class="rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                {{ auth.user ? initials(auth.user.full_name) : 'U' }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold text-foreground">{{ auth.user?.full_name }}</span>
              <span class="truncate text-xs text-muted-foreground capitalize">{{ auth.user?.role?.name }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl border border-border/40 shadow-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="6"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-3 py-2.5 text-left text-sm">
              <Avatar class="h-9 w-9 rounded-xl border border-primary/20">
                <AvatarFallback class="rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                  {{ auth.user ? initials(auth.user.full_name) : 'U' }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ auth.user?.full_name }}</span>
                <span class="truncate text-xs text-muted-foreground">{{ auth.user?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem class="rounded-lg cursor-pointer">
              <Settings class="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem class="rounded-lg cursor-pointer">
              <Bell class="mr-2 size-4" />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="rounded-lg cursor-pointer text-destructive focus:text-destructive" @click="logout">
            <LogOut class="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
