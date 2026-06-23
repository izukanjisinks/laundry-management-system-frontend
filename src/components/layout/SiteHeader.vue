<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

defineProps<{ title?: string }>()
</script>

<template>
  <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
    <div class="flex items-center gap-2">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <span v-if="title" class="font-semibold text-sm">{{ title }}</span>
    </div>
    <div class="ml-auto flex items-center gap-2">
      <slot />
    </div>
  </header>
</template>
