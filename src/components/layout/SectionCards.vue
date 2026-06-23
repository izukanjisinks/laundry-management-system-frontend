<script setup lang="ts">
import { TrendingDownIcon, TrendingUpIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StatCard {
  title: string
  value: string | number
  trend?: number
  description?: string
}

defineProps<{ cards: StatCard[] }>()
</script>

<template>
  <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:from-primary/10 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
    <Card v-for="card in cards" :key="card.title" data-slot="card">
      <CardHeader class="relative">
        <CardDescription>{{ card.title }}</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ card.value }}
        </CardTitle>
        <div v-if="card.trend !== undefined" class="absolute right-4 top-4">
          <Badge
            variant="outline"
            class="flex gap-1 rounded-lg text-xs"
            :class="card.trend >= 0 ? 'text-green-600' : 'text-red-600'"
          >
            <TrendingUpIcon v-if="card.trend >= 0" class="size-3" />
            <TrendingDownIcon v-else class="size-3" />
            {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}%
          </Badge>
        </div>
      </CardHeader>
      <CardFooter v-if="card.description" class="flex-col items-start gap-1 text-sm">
        <div class="text-muted-foreground">{{ card.description }}</div>
      </CardFooter>
    </Card>
  </div>
</template>

