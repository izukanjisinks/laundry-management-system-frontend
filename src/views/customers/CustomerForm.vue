<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const router = useRouter()
const error = ref('')
const submitting = ref(false)

const form = ref({ name: '', phone: '', email: '', address: '', notes: '' })

async function submit() {
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  if (!form.value.phone.trim()) { error.value = 'Phone is required'; return }
  submitting.value = true
  error.value = ''
  try {
    const payload: Record<string, string> = { name: form.value.name, phone: form.value.phone }
    if (form.value.email) payload.email = form.value.email
    if (form.value.address) payload.address = form.value.address
    if (form.value.notes) payload.notes = form.value.notes
    const { data } = await customersApi.create(payload)
    router.push(`/customers/${data.data.id}`)
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Failed to create customer'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
    <SiteHeader title="New Customer" />

    <div style="flex:1;overflow:auto;padding:26px 28px;display:flex;justify-content:center;">
      <div style="width:100%;max-width:540px;">
        <div style="background:#fff;border:1px solid #ece8e3;border-radius:16px;padding:28px;">
          <div style="font-size:16px;font-weight:700;margin-bottom:20px;">Customer details</div>

          <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:16px;">

            <div>
              <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">
                Full name <span style="color:#F26F21;">*</span>
              </label>
              <input
                v-model="form.name"
                placeholder="e.g. Amara Okafor"
                required
                style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;"
                @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
                @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
              />
            </div>

            <div>
              <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">
                Phone <span style="color:#F26F21;">*</span>
              </label>
              <input
                v-model="form.phone"
                placeholder="+1 (415) 555-0142"
                required
                style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;"
                @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
                @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
              />
            </div>

            <div>
              <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">Email</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="customer@email.com"
                style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;"
                @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
                @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
              />
            </div>

            <div>
              <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">Address</label>
              <input
                v-model="form.address"
                placeholder="123 Main St"
                style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;"
                @focus="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#F26F21')"
                @blur="(e: FocusEvent) => ((e.target as HTMLInputElement).style.borderColor = '#ece8e3')"
              />
            </div>

            <div>
              <label style="font-size:13px;font-weight:700;color:#3a4250;display:block;margin-bottom:6px;">Notes</label>
              <textarea
                v-model="form.notes"
                placeholder="Any special instructions…"
                rows="3"
                style="width:100%;border:1.5px solid #ece8e3;border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;color:#222831;outline:none;background:#faf8f6;box-sizing:border-box;resize:vertical;"
                @focus="(e: FocusEvent) => ((e.target as HTMLTextAreaElement).style.borderColor = '#F26F21')"
                @blur="(e: FocusEvent) => ((e.target as HTMLTextAreaElement).style.borderColor = '#ece8e3')"
              />
            </div>

            <p v-if="error" style="font-size:13px;color:#d6453d;background:#fdeceb;border-radius:9px;padding:10px 13px;margin:0;">{{ error }}</p>

            <div style="display:flex;gap:10px;margin-top:4px;">
              <button
                type="button"
                @click="router.back()"
                style="flex:1;border:1px solid #ece8e3;background:#fff;color:#5b6472;font:inherit;font-weight:700;font-size:14px;padding:13px;border-radius:12px;cursor:pointer;"
              >Cancel</button>
              <button
                type="submit"
                :disabled="submitting"
                style="flex:2;border:none;background:#F26F21;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:13px;border-radius:12px;cursor:pointer;box-shadow:0 10px 20px -10px #F26F21;"
              >
                {{ submitting ? 'Creating…' : 'Create customer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
