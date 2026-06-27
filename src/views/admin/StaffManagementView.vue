<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usersApi } from '@/api/users'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import type { Role, User } from '@/types'

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const loading = ref(true)
const search = ref('')

// ── Create dialog ────────────────────────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = ref({ full_name: '', email: '', password: '', role_id: '' })
const showCreatePassword = ref(false)

// ── Edit dialog ──────────────────────────────────────────────────────────────
const showEdit = ref(false)
const editing = ref(false)
const editError = ref('')
const editTarget = ref<User | null>(null)
const editForm = ref({ full_name: '', email: '', role_id: '', is_active: true, new_password: '' })
const showEditPassword = ref(false)

async function fetchAll() {
  loading.value = true
  try {
    const [usersRes, rolesRes] = await Promise.all([usersApi.list(), usersApi.listRoles()])
    users.value = usersRes.data.data ?? []
    roles.value = rolesRes.data.data ?? []
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(
    (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

// ── Create ───────────────────────────────────────────────────────────────────
function openCreate() {
  createForm.value = { full_name: '', email: '', password: '', role_id: roles.value[0]?.id ?? '' }
  createError.value = ''
  showCreatePassword.value = false
  showCreate.value = true
}

async function submitCreate() {
  creating.value = true
  createError.value = ''
  try {
    await usersApi.create(createForm.value)
    showCreate.value = false
    await fetchAll()
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? 'Failed to create user'
  } finally {
    creating.value = false
  }
}

// ── Edit ─────────────────────────────────────────────────────────────────────
function openEdit(u: User) {
  editTarget.value = u
  editForm.value = {
    full_name: u.full_name,
    email: u.email,
    role_id: u.role?.id ?? '',
    is_active: u.is_active,
    new_password: '',
  }
  editError.value = ''
  showEditPassword.value = false
  showEdit.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  editing.value = true
  editError.value = ''
  try {
    await usersApi.update(editTarget.value.id, {
      full_name: editForm.value.full_name,
      email: editForm.value.email,
      role_id: editForm.value.role_id,
      is_active: editForm.value.is_active,
    })
    if (editForm.value.new_password) {
      await usersApi.updatePassword(editTarget.value.id, editForm.value.new_password)
    }
    showEdit.value = false
    await fetchAll()
  } catch (e: any) {
    editError.value = e.response?.data?.error ?? 'Failed to update user'
  } finally {
    editing.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function memberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

function lastSeen(dateStr?: string) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

onMounted(fetchAll)
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="Staff Management" />

    <div style="flex:1;overflow:auto;padding:26px 28px;">

      <!-- Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;background:#f3f0ec;border-radius:11px;padding:9px 14px;width:280px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>
          </svg>
          <input
            v-model="search"
            placeholder="Search name or email…"
            style="border:none;background:transparent;outline:none;font:inherit;font-size:13.5px;color:#5b6472;width:100%;"
          />
        </div>
        <button
          @click="openCreate"
          style="border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:13px;padding:10px 16px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:7px;"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New staff
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align:center;color:#9aa1ab;font-size:14px;padding:40px 0;">Loading…</div>

      <!-- Table -->
      <div v-else style="background:#fff;border:1px solid #ece8e3;border-radius:16px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:2fr 1.6fr 0.8fr 0.9fr 1fr 0.7fr;font-size:11px;font-weight:700;letter-spacing:0.4px;color:#aab0ba;padding:14px 20px;border-bottom:1px solid #f1eeea;">
          <div>NAME</div><div>EMAIL</div><div>ROLE</div><div>STATUS</div><div>LAST SEEN</div><div>JOINED</div>
        </div>

        <div
          v-for="u in filtered"
          :key="u.id"
          @click="openEdit(u)"
          style="display:grid;grid-template-columns:2fr 1.6fr 0.8fr 0.9fr 1fr 0.7fr;align-items:center;padding:14px 20px;border-bottom:1px solid #f6f3ef;cursor:pointer;transition:background 0.1s;"
          @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')"
          @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <!-- Name -->
          <div style="display:flex;align-items:center;gap:11px;">
            <div style="width:34px;height:34px;border-radius:10px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:none;">
              {{ initials(u.full_name) }}
            </div>
            <span style="font-size:14px;font-weight:700;">{{ u.full_name }}</span>
          </div>

          <!-- Email -->
          <div style="font-size:13.5px;color:#5b6472;">{{ u.email }}</div>

          <!-- Role -->
          <div>
            <span :style="{
              fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'20px',
              background: u.role?.name === 'admin' ? '#FEF1E9' : '#f3f0ec',
              color: u.role?.name === 'admin' ? '#D85D14' : '#5b6472',
              textTransform: 'capitalize',
            }">{{ u.role?.name ?? '—' }}</span>
          </div>

          <!-- Status -->
          <div>
            <span :style="{
              fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'20px',
              background: u.is_active ? '#e8f7ef' : '#f3f0ec',
              color: u.is_active ? '#1a9e5a' : '#9aa1ab',
            }">{{ u.is_active ? 'Active' : 'Inactive' }}</span>
          </div>

          <!-- Last seen -->
          <div style="font-size:13px;color:#9aa1ab;">{{ lastSeen(u.last_login_at) }}</div>

          <!-- Joined -->
          <div style="font-size:13px;color:#9aa1ab;">{{ memberSince(u.created_at) }}</div>
        </div>

        <div v-if="filtered.length === 0" style="text-align:center;color:#9aa1ab;font-size:14px;padding:40px 0;">
          {{ search ? 'No staff match your search' : 'No staff accounts yet' }}
        </div>
      </div>
    </div>

    <!-- ── Create Dialog ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCreate"
          style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;"
          @click.self="showCreate = false"
        >
          <!-- Blurred backdrop -->
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);"></div>

          <div style="position:relative;background:#fff;border-radius:20px;padding:32px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
            <div style="font-size:18px;font-weight:800;margin-bottom:6px;">Create Staff Account</div>
            <div style="font-size:13.5px;color:#9aa1ab;margin-bottom:24px;">Staff can log in immediately after creation.</div>

            <form @submit.prevent="submitCreate" style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">FULL NAME</label>
                <input v-model="createForm.full_name" required placeholder="Jane Doe" style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">EMAIL</label>
                <input v-model="createForm.email" type="email" required placeholder="staff@washpoint.app" style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">PASSWORD</label>
                <div style="position:relative;">
                  <input v-model="createForm.password" :type="showCreatePassword ? 'text' : 'password'" required placeholder="••••••••" style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 40px 10px 13px;font:inherit;font-size:14px;outline:none;"
                    @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                    @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
                  <button type="button" @click="showCreatePassword = !showCreatePassword" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;padding:4px;color:#9aa1ab;display:flex;align-items:center;">
                    <svg v-if="!showCreatePassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">ROLE</label>
                <select v-model="createForm.role_id" required style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;background:#fff;appearance:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLSelectElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLSelectElement).style.borderColor='#ece8e3')">
                  <option v-for="r in roles" :key="r.id" :value="r.id" style="text-transform:capitalize;">{{ r.name }}</option>
                </select>
              </div>

              <p v-if="createError" style="font-size:13px;color:#e05252;margin:0;">{{ createError }}</p>

              <div style="display:flex;gap:10px;margin-top:4px;">
                <button type="button" @click="showCreate = false" style="flex:1;border:1.5px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13.5px;padding:11px;border-radius:11px;cursor:pointer;">Cancel</button>
                <button type="submit" :disabled="creating" :style="{ flex:1, border:'none', background:'#F26F21', color:'#fff', font:'inherit', fontWeight:'700', fontSize:'13.5px', padding:'11px', borderRadius:'11px', cursor:'pointer', opacity: creating ? 0.7 : 1 }">
                  {{ creating ? 'Creating…' : 'Create Staff' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit Dialog ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showEdit && editTarget"
          style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;"
          @click.self="showEdit = false"
        >
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);"></div>

          <div style="position:relative;background:#fff;border-radius:20px;padding:32px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
              <div style="width:42px;height:42px;border-radius:12px;background:#FEF1E9;color:#D85D14;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none;">
                {{ initials(editTarget.full_name) }}
              </div>
              <div>
                <div style="font-size:17px;font-weight:800;">Edit Staff</div>
                <div style="font-size:13px;color:#9aa1ab;">{{ editTarget.email }}</div>
              </div>
            </div>

            <form @submit.prevent="submitEdit" style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">FULL NAME</label>
                <input v-model="editForm.full_name" required style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">EMAIL</label>
                <input v-model="editForm.email" type="email" required style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">ROLE</label>
                <select v-model="editForm.role_id" required style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 13px;font:inherit;font-size:14px;outline:none;background:#fff;appearance:none;"
                  @focus="(e:FocusEvent) => ((e.target as HTMLSelectElement).style.borderColor='#F26F21')"
                  @blur="(e:FocusEvent) => ((e.target as HTMLSelectElement).style.borderColor='#ece8e3')">
                  <option v-for="r in roles" :key="r.id" :value="r.id" style="text-transform:capitalize;">{{ r.name }}</option>
                </select>
              </div>

              <!-- Active toggle -->
              <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:#f9f8f6;border-radius:12px;">
                <div>
                  <div style="font-size:13.5px;font-weight:700;">Account active</div>
                  <div style="font-size:12px;color:#9aa1ab;margin-top:2px;">Inactive staff cannot log in</div>
                </div>
                <button
                  type="button"
                  @click="editForm.is_active = !editForm.is_active"
                  :style="{
                    width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer',
                    background: editForm.is_active ? '#F26F21' : '#ddd',
                    position:'relative', transition:'background 0.2s', flexShrink:'0',
                  }"
                >
                  <span :style="{
                    position:'absolute', top:'3px', width:'18px', height:'18px', borderRadius:'50%',
                    background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s',
                    left: editForm.is_active ? '23px' : '3px',
                  }"></span>
                </button>
              </div>

              <!-- Optional new password -->
              <div>
                <label style="font-size:12px;font-weight:700;color:#5b6472;display:block;margin-bottom:6px;">NEW PASSWORD <span style="font-weight:400;color:#aab0ba;">(leave blank to keep current)</span></label>
                <div style="position:relative;">
                  <input v-model="editForm.new_password" :type="showEditPassword ? 'text' : 'password'" placeholder="••••••••" style="width:100%;box-sizing:border-box;border:1.5px solid #ece8e3;border-radius:10px;padding:10px 40px 10px 13px;font:inherit;font-size:14px;outline:none;"
                    @focus="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#F26F21')"
                    @blur="(e:FocusEvent) => ((e.target as HTMLInputElement).style.borderColor='#ece8e3')" />
                  <button type="button" @click="showEditPassword = !showEditPassword" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;padding:4px;color:#9aa1ab;display:flex;align-items:center;">
                    <svg v-if="!showEditPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>

              <p v-if="editError" style="font-size:13px;color:#e05252;margin:0;">{{ editError }}</p>

              <div style="display:flex;gap:10px;margin-top:4px;">
                <button type="button" @click="showEdit = false" style="flex:1;border:1.5px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:13.5px;padding:11px;border-radius:11px;cursor:pointer;">Cancel</button>
                <button type="submit" :disabled="editing" :style="{ flex:1, border:'none', background:'#F26F21', color:'#fff', font:'inherit', fontWeight:'700', fontSize:'13.5px', padding:'11px', borderRadius:'11px', cursor:'pointer', opacity: editing ? 0.7 : 1 }">
                  {{ editing ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
