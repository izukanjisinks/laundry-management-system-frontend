<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Customer, OrderItem } from '@/types'
import { Plus, Trash2 } from '@lucide/vue'

const router = useRouter()
const customers = ref<Customer[]>([])
const customerId = ref('')
const notes = ref('')
const error = ref('')
const submitting = ref(false)

const items = ref<OrderItem[]>([{ name: '', qty: 1, price: 0 }])

const total = computed(() =>
  items.value.reduce((sum, i) => sum + i.qty * i.price, 0),
)

function addItem() {
  items.value.push({ name: '', qty: 1, price: 0 })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

onMounted(async () => {
  const { data } = await customersApi.list()
  customers.value = data.data
})

async function submit() {
  if (!customerId.value) { error.value = 'Please select a customer'; return }
  submitting.value = true
  error.value = ''
  try {
    await ordersApi.create({
      customer_id: customerId.value,
      items: items.value,
      notes: notes.value || undefined,
      total_price: total.value,
    })
    router.push('/orders')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Failed to create order'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="New Order">
      <Button variant="outline" size="sm" @click="router.back()">Cancel</Button>
    </SiteHeader>
    <form @submit.prevent="submit" class="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card>
        <CardHeader><CardTitle class="text-sm">Customer</CardTitle></CardHeader>
        <CardContent>
          <Select v-model="customerId" required>
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select customerâ€¦" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }} â€” {{ c.phone }}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm">Items</CardTitle>
            <Button type="button" variant="outline" size="sm" @click="addItem">
              <Plus class="mr-1 size-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div v-for="(item, i) in items" :key="i" class="flex items-center gap-2">
            <Input v-model="item.name" placeholder="Item name" class="flex-1" required />
            <Input v-model.number="item.qty" type="number" min="1" class="w-20" placeholder="Qty" required />
            <Input v-model.number="item.price" type="number" min="0" step="0.01" class="w-28" placeholder="Price" required />
            <Button type="button" variant="ghost" size="icon" @click="removeItem(i)" :disabled="items.length === 1">
              <Trash2 class="size-4 text-destructive" />
            </Button>
          </div>
          <div class="text-right text-sm font-semibold pt-2">
            Total: K{{ total.toFixed(2) }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm">Notes</CardTitle></CardHeader>
        <CardContent>
          <Input v-model="notes" placeholder="Optional notesâ€¦" />
        </CardContent>
      </Card>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <div class="flex justify-end">
        <Button type="submit" :disabled="submitting">
          {{ submitting ? 'Creatingâ€¦' : 'Create Order' }}
        </Button>
      </div>
    </form>
  </div>
</template>

