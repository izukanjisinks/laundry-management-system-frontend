<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, ChevronUp, ChevronsUpDown } from '@lucide/vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => string
}

const props = defineProps<{
  columns: Column[]
  rows: Record<string, any>[]
  caption?: string
}>()

const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  return [...props.rows].sort((a, b) => {
    const av = a[sortKey.value!]
    const bv = b[sortKey.value!]
    if (av === bv) return 0
    const cmp = av > bv ? 1 : -1
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const visibleColumns = ref<Set<string>>(new Set(props.columns.map((c) => c.key)))

function toggleColumn(key: string) {
  if (visibleColumns.value.has(key)) {
    visibleColumns.value.delete(key)
  } else {
    visibleColumns.value.add(key)
  }
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between px-4 py-2 lg:px-6">
      <p v-if="caption" class="text-sm text-muted-foreground">{{ caption }}</p>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="ml-auto">
            Columns <ChevronDown class="ml-2 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="col in columns"
            :key="col.key"
            :checked="visibleColumns.has(col.key)"
            @update:checked="toggleColumn(col.key)"
          >
            {{ col.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="overflow-x-auto rounded-lg border mx-4 lg:mx-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              v-for="col in columns"
              :key="col.key"
              v-show="visibleColumns.has(col.key)"
              class="cursor-pointer select-none"
              @click="col.sortable ? toggleSort(col.key) : undefined"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <template v-if="col.sortable">
                  <ChevronUp v-if="sortKey === col.key && sortDir === 'asc'" class="size-4" />
                  <ChevronDown v-else-if="sortKey === col.key && sortDir === 'desc'" class="size-4" />
                  <ChevronsUpDown v-else class="size-4 text-muted-foreground" />
                </template>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(row, i) in sortedRows" :key="i">
            <TableCell
              v-for="col in columns"
              :key="col.key"
              v-show="visibleColumns.has(col.key)"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ col.render ? col.render(row) : row[col.key] }}
              </slot>
            </TableCell>
          </TableRow>
          <TableRow v-if="sortedRows.length === 0">
            <TableCell :colspan="columns.length" class="text-center text-muted-foreground py-8">
              No data
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

