<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import DataTable from '@/components/layout/DataTable.vue'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types'
import { Plus } from '@lucide/vue'

const router = useRouter()
const customers = ref<Customer[]>([])
const loading = ref(true)

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'address', label: 'Address', sortable: false },
  { key: 'created_at', label: 'Since', sortable: true, render: (r: Customer) => new Date(r.created_at).toLocaleDateString() },
]

onMounted(async () => {
  try {
    const { data } = await customersApi.list()
    customers.value = data.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Customers">
      <Button size="sm" @click="router.push('/customers/new')">
        <Plus class="mr-1 size-4" /> New Customer
      </Button>
    </SiteHeader>
    <div class="flex flex-1 flex-col gap-4 py-4">
      <div v-if="loading" class="px-4 text-sm text-muted-foreground lg:px-6">Loadingâ€¦</div>
      <DataTable v-else :columns="columns" :rows="customers" caption="All customers">
        <template #cell-name="{ row }">
          <button
            class="font-medium underline-offset-2 hover:underline"
            @click="router.push(`/customers/${row.id}`)"
          >
            {{ row.name }}
          </button>
        </template>
      </DataTable>
    </div>
  </div>
</template>

