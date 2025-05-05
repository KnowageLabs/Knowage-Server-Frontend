<template>
    <div class="kn-page-content p-grid p-m-0">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>AI functionalities management</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm" v-if="store.isEnterprise && store.configurations['KNOWAGE.AI.URL']">
            <q-btn label="Syncronize Tenant" @click.stop="syncronize" />
        </div>
    </div>
</template>
<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { onMounted, ref } from 'vue'

const store = mainStore()
const update = ref<string | null>(null)
const updateError = ref<string | null>(null)

onMounted(() => {
    if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
        getLastUpdate()
    }
})

function syncronize() {
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/api/synchronize', {
            tenant: store.user.tenantId,
            token: localStorage.getItem('token'),
            urlExcel: //
        })
        .then((response) => {
            console.log(response.data)
        })
        .catch((error) => {
            console.error(error)
        })
}

function getLastUpdate() {
    axios
        .get(store.configurations['KNOWAGE.AI.URL'] + '/api/update')
        .then((response) => {
            if (response.data) update.value = response.data
        })
        .catch((error) => {
            updateError.value = error.data || 'No data available'
        })
}
</script>
