<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const name = ref('')
const phone = ref('')
const address = ref('')
const notes = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    await customersApi.create({ name: name.value, phone: phone.value, address: address.value, notes: notes.value })
    router.push('/customers')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Failed to create customer'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="New Customer">
      <Button variant="outline" size="sm" @click="router.back()">Cancel</Button>
    </SiteHeader>
    <form @submit.prevent="submit" class="flex flex-1 flex-col gap-4 p-4 lg:p-6 max-w-lg">
      <Card>
        <CardHeader><CardTitle class="text-sm">Customer Details</CardTitle></CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Name *</label>
            <Input v-model="name" placeholder="Full name" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Phone *</label>
            <Input v-model="phone" placeholder="+260 97 000 0000" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Address</label>
            <Input v-model="address" placeholder="Street address" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Notes</label>
            <Input v-model="notes" placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <div class="flex justify-end">
        <Button type="submit" :disabled="submitting">
          {{ submitting ? 'Saving…' : 'Create Customer' }}
        </Button>
      </div>
    </form>
  </div>
</template>
