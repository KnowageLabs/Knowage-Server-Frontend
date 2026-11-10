<template>
    <div class="kn-page lpm-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.loginPageManagement.title') }}</q-toolbar-title>
            <q-btn flat dense round icon="undo" :disable="busy || !loaded" :title="$t('managers.loginPageManagement.reset')" @click="reset" />
            <q-btn flat dense round icon="save" :disable="busy || !loaded || !dirty || !valid" :title="$t('common.save')" @click="save" />
        </q-toolbar>
        <q-linear-progress v-if="loading" indeterminate color="primary" />
        <div class="q-pa-lg lpm-body">
            <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md" role="alert">{{ error }}</q-banner>
            <q-card flat bordered class="q-mb-lg">
                <q-card-section class="lpm-settings-header row items-center q-py-sm">
                    <q-icon name="tune" size="20px" color="primary" class="q-mr-sm" />
                    <span class="text-subtitle1 text-weight-medium">{{ $t('managers.loginPageManagement.configuration') }}</span>
                    <q-chip v-if="dirty" dense color="orange-2" text-color="orange-9" icon="edit" class="q-ml-md">{{ $t('common.toast.unsavedChangesHeader') }}</q-chip>
                </q-card-section>
                <q-separator />
                <q-card-section>
                    <p class="text-body2 text-grey-7">{{ $t('managers.loginPageManagement.hint') }}</p>
                    <div class="row q-col-gutter-md">
                        <div v-for="field in fields" :key="field.key" class="col-12 col-md-4">
                            <q-input
                                v-model="config[field.key]"
                                outlined
                                dense
                                clearable
                                :disable="busy || !loaded"
                                :label="$t(`managers.loginPageManagement.${field.key}`)"
                                :hint="$t('managers.loginPageManagement.defaultHint')"
                                :error="!isLoginImageUrl((config[field.key] || '').trim())"
                                :error-message="$t('managers.loginPageManagement.invalidUrl')"
                            >
                                <template #prepend><q-icon :name="field.icon" color="grey-6" /></template>
                                <template #after>
                                    <q-btn
                                        flat
                                        dense
                                        round
                                        color="primary"
                                        icon="file_upload"
                                        :disable="busy || !loaded"
                                        :loading="uploading === field.key"
                                        :aria-label="`${$t('managers.loginPageManagement.upload')}: ${$t(`managers.loginPageManagement.${field.key}`)}`"
                                        :title="$t('managers.loginPageManagement.upload')"
                                        @click="filePickers[field.key]?.pickFiles()"
                                    >
                                        <q-tooltip>{{ $t('managers.loginPageManagement.uploadHint') }}</q-tooltip>
                                    </q-btn>
                                </template>
                            </q-input>
                            <q-file
                                :ref="(picker) => (filePickers[field.key] = picker as QFile | null)"
                                :model-value="null"
                                class="hidden"
                                :accept="loginImageUploadAccept"
                                :max-file-size="loginImageUploadLimit"
                                :disable="busy || !loaded"
                                @update:model-value="(file) => uploadImage(field.key, file)"
                                @rejected="error = $t('managers.loginPageManagement.invalidImage')"
                            />
                        </div>
                    </div>
                    <div v-if="serializedConfig.length > 1000" class="text-negative q-mt-md" role="alert">{{ $t('managers.loginPageManagement.tooLong') }}</div>
                </q-card-section>
            </q-card>
            <q-card flat bordered>
                <q-card-section class="row items-center q-py-sm q-gutter-y-sm">
                    <q-icon name="visibility" size="18px" color="primary" class="q-mr-sm" />
                    <span class="text-subtitle2 text-weight-medium">{{ $t('managers.loginPageManagement.preview') }}</span>
                    <q-space />
                    <q-btn-toggle v-model="previewDevice" :options="previewDevices" dense no-caps outline color="primary" toggle-color="primary" />
                </q-card-section>
                <q-separator />
                <div class="lpm-preview-shell">
                    <div class="lpm-preview-viewport" :style="{ maxWidth: previewWidths[previewDevice] }">
                        <div class="row items-center bg-grey-2 q-pa-sm">
                            <img :key="preview.faviconUrl" :src="preview.faviconUrl || defaultLoginBranding.faviconUrl" alt="" class="lpm-favicon q-mr-sm" @error="useDefaultFavicon" />
                            <span class="text-caption">Knowage</span>
                        </div>
                        <LoginLayout :background-url="preview.backgroundUrl" :logo-url="preview.logoUrl" preview>
                            <q-card-section>
                                <div class="login-form">
                                    <q-input :label="$t('common.loginPage.username')" outlined bottom-slots>
                                        <template #prepend><q-icon name="person" /></template>
                                    </q-input>
                                    <q-input :label="$t('common.loginPage.password')" type="password" outlined bottom-slots>
                                        <template #prepend><q-icon name="lock" /></template>
                                        <template #append><q-icon name="visibility_off" /></template>
                                    </q-input>
                                    <div><q-btn :label="$t('common.loginPage.signIn')" color="primary" class="full-width" /></div>
                                </div>
                            </q-card-section>
                            <q-card-section class="text-center q-pt-none">
                                <div class="text-caption text-primary q-mb-sm">{{ $t('common.loginPage.forgotPassword') }}</div>
                                <div class="text-caption text-grey-7">{{ $t('common.loginPage.noAccount') }} <span class="text-primary">{{ $t('common.loginPage.registerNow') }}</span></div>
                            </q-card-section>
                        </LoginLayout>
                    </div>
                </div>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { QFile } from 'quasar'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.js'
import mainStore from '@/App.store'
import LoginLayout from '@/views/login/LoginLayout.vue'
import { defaultLoginBranding, isLoginImageFile, isLoginImageUrl, loginImageUploadAccept, loginImageUploadLimit, normalizeLoginBranding } from '@/helpers/commons/loginBranding'
import type { LoginBranding } from '@/helpers/commons/loginBranding'

const { t } = useI18n()
const store = mainStore()
const endpoint = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/loginconfig`
const fields: { key: keyof LoginBranding; icon: string }[] = [
    { key: 'backgroundUrl', icon: 'image' },
    { key: 'logoUrl', icon: 'business' },
    { key: 'faviconUrl', icon: 'tab' }
]
const config = ref<LoginBranding>(normalizeLoginBranding())
const filePickers: Partial<Record<keyof LoginBranding, QFile | null>> = {}
const saved = ref(JSON.stringify(config.value))
const loading = ref(false)
const uploading = ref<keyof LoginBranding | null>(null)
const busy = computed(() => loading.value || uploading.value !== null)
const previewDevice = ref('desktop')
const previewWidths: Record<string, string> = { desktop: '100%', tablet: '768px', mobile: '375px' }
const previewDevices = computed(() => [
    { value: 'desktop', label: t('managers.loginPageManagement.desktop'), icon: 'desktop_windows' },
    { value: 'tablet', label: t('managers.loginPageManagement.tablet'), icon: 'tablet' },
    { value: 'mobile', label: t('managers.loginPageManagement.mobile'), icon: 'smartphone' }
])
const loaded = ref(false)
const error = ref('')
const normalized = computed(() => normalizeLoginBranding(config.value))
const serializedConfig = computed(() => JSON.stringify(normalized.value))
const dirty = computed(() => serializedConfig.value !== saved.value)
const valid = computed(() => serializedConfig.value.length <= 1000 && Object.values(normalized.value).every(isLoginImageUrl))
const preview = computed(() => normalizeLoginBranding(Object.fromEntries(Object.entries(normalized.value).map(([field, url]) => [field, isLoginImageUrl(url) ? url : '']))))

function reset() {
    config.value = normalizeLoginBranding()
}

function useDefaultFavicon(event: Event) {
    const image = event.target as HTMLImageElement
    if (image.getAttribute('src') !== defaultLoginBranding.faviconUrl) image.src = defaultLoginBranding.faviconUrl
}

async function uploadImage(field: keyof LoginBranding, file: File | null) {
    if (!file || busy.value || !loaded.value) return
    error.value = ''
    if (!isLoginImageFile(file)) {
        error.value = t('managers.loginPageManagement.invalidImage')
        return
    }
    uploading.value = field
    try {
        const body = new FormData()
        body.append('file', file)
        const { data } = await axios.post(`${endpoint}/images`, body)
        if (typeof data.url !== 'string' || !data.url || !isLoginImageUrl(data.url)) throw new Error('Invalid image URL')
        config.value[field] = data.url
    } catch {
        error.value = t('managers.loginPageManagement.uploadError')
    } finally {
        uploading.value = null
    }
}

async function save() {
    if (!loaded.value || busy.value || !valid.value || !dirty.value) return
    loading.value = true
    error.value = ''
    try {
        const { data } = await axios.put(`${endpoint}/branding`, normalized.value)
        config.value = normalizeLoginBranding(data)
        saved.value = JSON.stringify(config.value)
        store.setInfo({ title: t('managers.loginPageManagement.title'), msg: t('managers.loginPageManagement.saveSuccess') })
    } catch {
        error.value = t('managers.loginPageManagement.saveError')
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    loading.value = true
    try {
        const { data } = await axios.get(endpoint)
        config.value = normalizeLoginBranding(data.items?.[0])
        saved.value = JSON.stringify(config.value)
        loaded.value = true
    } catch {
        error.value = t('managers.loginPageManagement.loadError')
    } finally {
        loading.value = false
    }
})
</script>

<style scoped lang="scss">
.lpm-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.lpm-body {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
}

.lpm-preview-shell {
    padding: 16px;
    background: #e9edf2;
}

.lpm-preview-viewport {
    width: 100%;
    min-width: 0;
    margin-inline: auto;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #d5dbe3;
}

@media (max-width: 599px) {
    .lpm-body {
        padding: 12px;
    }

    .lpm-preview-shell {
        padding: 4px;
    }
}

.lpm-settings-header {
    background: linear-gradient(135deg, #f5f7ff 0%, #eef1fb 100%);
}

.lpm-favicon {
    width: 16px;
    height: 16px;
    object-fit: contain;
}
</style>
