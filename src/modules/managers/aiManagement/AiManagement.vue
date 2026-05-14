<template>
    <div class="kn-page-content p-grid p-m-0">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.ai.title') }}</q-toolbar-title>
        </q-toolbar>
        <div class="row q-pa-md q-col-gutter-md fit">
            <KnHint class="col-8" :title="'managers.ai.title'" :hint="'managers.ai.hint'" data-test="hint"></KnHint>

            <div class="col-4">
                <q-card class="ai-management-card" flat bordered>
                    <!-- Header -->
                    <div class="ai-card-header column items-center justify-center q-pa-xl">
                        <q-icon name="smart_toy" size="72px" class="ai-header-icon" />
                        <div class="text-subtitle1 text-weight-medium q-mt-md">AI Engine</div>
                    </div>

                    <q-separator />

                    <!-- Status Section -->
                    <q-card-section class="q-pa-md">
                        <div class="row items-center q-mb-xs">
                            <q-icon :name="statusIcon" :color="statusColor" size="xs" class="q-mr-sm" />
                            <span class="text-caption text-grey-7 text-weight-medium text-uppercase">{{ $t('common.lastChangeDate') }}</span>
                        </div>
                        <div class="q-pl-md text-body2">
                            <span v-if="loading" class="row items-center">
                                <q-spinner size="xs" color="primary" class="q-mr-xs" />
                                <span class="text-grey-6">{{ $t('common.status') }}...</span>
                            </span>
                            <span v-else class="text-weight-medium">{{ update || $t('common.never') }}</span>
                        </div>
                    </q-card-section>

                    <template v-if="store.isEnterprise && store.configurations['KNOWAGE.AI.URL']">
                        <q-separator />
                        <q-card-actions class="q-pa-md">
                            <q-btn color="primary" unelevated :disable="loading" class="full-width ai-sync-btn" @click.stop="syncronize">
                                <q-icon :name="loading ? 'hourglass_empty' : 'sync'" class="q-mr-sm" :class="{ 'ai-spin': loading }" />
                                {{ $t('managers.ai.syncronize') }}
                            </q-btn>
                        </q-card-actions>
                    </template>
                </q-card>

                <!-- Error Banner -->
                <q-banner v-if="updateError" rounded class="bg-warning q-mt-md">
                    <template v-slot:avatar>
                        <q-icon name="warning" color="white" />
                    </template>
                    <span class="text-white text-body2">{{ updateError }}</span>
                    <template v-slot:action>
                        <q-btn flat color="white" icon="close" round dense size="sm" @click="updateError = null" />
                    </template>
                </q-banner>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, Ref } from 'vue'
import KnHint from '@/components/UI/KnHint.vue'

const store = mainStore()
const polling: Ref<number | null> = ref(null)
const update: Ref<Date | string | null> = ref(null)
const loading: Ref<boolean> = ref(false)
const updateError: Ref<string | null> = ref(null)

const statusIcon = computed(() => {
    if (loading.value) return 'hourglass_empty'
    if (updateError.value) return 'error_outline'
    if (update.value) return 'check_circle_outline'
    return 'radio_button_unchecked'
})

const statusColor = computed(() => {
    if (loading.value) return 'primary'
    if (updateError.value) return 'warning'
    if (update.value) return 'positive'
    return 'grey-5'
})

onMounted(() => {
    setTimeout(() => {
        if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
            getLastUpdate()
        }
    }, 2000)
    polling.value = setInterval(() => {
        if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
            getLastUpdate()
        }
    }, 10000)
})

onUnmounted(() => {
    if (polling.value) {
        clearInterval(polling.value)
        polling.value = null
    }
})

async function syncronize() {
    loading.value = true
    await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`).then((response) => {
        const root = response.data.root[0]
        const folder = root.children.find((folder) => folder.label === 'ai')
        const folderKey = folder ? folder.key : ''
        axios
            .post(store.configurations['KNOWAGE.AI.URL'] + '/load_data', {
                tenant: store.user.organization,
                token: sessionStorage.getItem('token'),
                urlExcel: { key: folderKey, selectedFilesNames: ['ai.xlsx'] }
            })
            .then((response) => {
                getLastUpdate()
                console.log(response.data)
            })
            .catch((error) => {
                console.error(error)
            })
    })
}

function getLastUpdate() {
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/last_update', {
            tenant: store.user.organization,
            token: sessionStorage.getItem('token')
        })
        .then((response) => {
            if (response.data.status === 'Loaded') {
                update.value = response.data.data.lastKBUpdate
            } else if (response.data.status === 'Error') {
                updateError.value = response.data.data.error.description
            }
            loading.value = response.data.status === 'In process'
        })
        .catch((error) => {
            updateError.value = error.data || 'No data available'
        })
}
</script>

<style scoped lang="scss">
.ai-management-card {
    border-radius: 8px;
    overflow: hidden;
}

.ai-card-header {
    background-color: var(--q-primary);
    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.15) 100%);
    color: white;
}

.ai-header-icon {
    color: rgba(255, 255, 255, 0.92);
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25));
}

.ai-sync-btn {
    font-weight: 600;
    letter-spacing: 0.4px;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.ai-spin {
    animation: spin 1.2s linear infinite;
}
</style>
