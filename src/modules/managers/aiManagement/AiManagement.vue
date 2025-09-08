<template>
    <div class="kn-page-content p-grid p-m-0">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.ai.title') }}</q-toolbar-title>
        </q-toolbar>
        <div class="row q-ma-sm q-mx-md fit">
            <KnHint class="col-8" :title="'managers.ai.title'" :hint="'managers.ai.hint'" data-test="hint"></KnHint>
            <q-card class="col-4" style="max-width: 300px">
                <q-img src="https://cdn.quasar.dev/img/parallax2.jpg">
                    <div class="absolute-bottom">
                        <div class="text-h6">{{ $t('common.lastChangeDate') }}:</div>
                        <div class="text-subtitle2">{{ update || $t('common.never') }}</div>
                    </div>
                </q-img>
                <q-card-actions class="justify-end">
                    <q-btn flat v-if="store.isEnterprise && store.configurations['KNOWAGE.AI.URL']" @click.stop="syncronize" :disable="loading">
                        <span>{{ $t('managers.ai.syncronize') }}</span>
                        <q-spinner v-if="loading" class="q-ml-sm" color="primary" size="1em" />
                    </q-btn>
                </q-card-actions>
            </q-card>
            <q-banner v-if="updateError" rounded dense class="bg-warning q-ma-sm text-center col-12">
                <template v-slot:avatar>
                    <q-icon name="warning" />
                </template>
                {{ updateError }}
            </q-banner>
        </div>
    </div>
</template>
<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { onMounted, ref, Ref } from 'vue'
import KnHint from '@/components/UI/KnHint.vue'

const store = mainStore()
const update: Ref<Date | string | null> = ref(null)
const loading: Ref<boolean> = ref(false)
const updateError: Ref<string | null> = ref(null)

onMounted(() => {
    setTimeout(() => {
        if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
            getLastUpdate()
        }
    }, 2000)
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
                token: localStorage.getItem('token'),
                urlExcel: { key: folderKey, selectedFilesNames: ['ai.xls'] }
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
        .post(store.configurations['KNOWAGE.AI.URL'] + '/last_update', { tenant: store.user.organization })
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
