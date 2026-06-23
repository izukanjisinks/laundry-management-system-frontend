<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usersApi } from '@/api/users'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import DataTable from '@/components/layout/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { User } from '@/types'
import { Plus } from '@lucide/vue'

const users = ref<User[]>([])
const loading = ref(true)
const showDialog = ref(false)
const submitting = ref(false)
const error = ref('')

const form = ref({ full_name: '', email: '', password: '' })

const columns = [
  { key: 'full_name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', render: (r: User) => r.role?.name ?? 'â€”' },
  { key: 'is_active', label: 'Status' },
]

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await usersApi.list()
    users.value = data.data
  } finally {
    loading.value = false
  }
}

async function createStaff() {
  submitting.value = true
  error.value = ''
  try {
    await usersApi.create(form.value)
    showDialog.value = false
    form.value = { full_name: '', email: '', password: '' }
    await fetchUsers()
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Failed to create user'
  } finally {
    submitting.value = false
  }
}

async function deactivate(id: string) {
  if (!confirm('Deactivate this user?')) return
  await usersApi.remove(id)
  await fetchUsers()
}

onMounted(fetchUsers)
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SiteHeader title="Staff Management">
      <Button size="sm" @click="showDialog = true">
        <Plus class="mr-1 size-4" /> New Staff
      </Button>
    </SiteHeader>
    <div class="flex flex-1 flex-col gap-4 py-4">
      <div v-if="loading" class="px-4 text-sm text-muted-foreground lg:px-6">Loadingâ€¦</div>
      <DataTable v-else :columns="columns" :rows="users" caption="All staff accounts">
        <template #cell-is_active="{ value }">
          <Badge :variant="value ? 'default' : 'secondary'">
            {{ value ? 'Active' : 'Inactive' }}
          </Badge>
        </template>
        <template #cell-full_name="{ row }">
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium">{{ row.full_name }}</span>
            <Button
              v-if="row.is_active"
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="deactivate(row.id)"
            >
              Deactivate
            </Button>
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Staff Account</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createStaff" class="space-y-4 py-2">
          <div class="space-y-2">
            <label class="text-sm font-medium">Full Name</label>
            <Input v-model="form.full_name" placeholder="Jane Doe" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Email</label>
            <Input v-model="form.email" type="email" placeholder="staff@laundry.local" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Password</label>
            <Input v-model="form.password" type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showDialog = false">Cancel</Button>
            <Button type="submit" :disabled="submitting">
              {{ submitting ? 'Creatingâ€¦' : 'Create' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

