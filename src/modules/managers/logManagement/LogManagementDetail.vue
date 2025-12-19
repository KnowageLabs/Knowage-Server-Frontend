<template>
    <div class="log-detail">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title> {{ file?.name }}</q-toolbar-title>

            <q-btn flat round dense icon="refresh" data-test="refresh-button" @click="loadFileContent(file)">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.refresh') }}</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="close" data-test="close-button" @click="$emit('close')">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <div class="file-viewer-body">
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

            <knMonaco v-if="typeof content === 'string' && content.length > 0" class="file-viewer__editor" v-model="content" language="logLang" :options="{ readOnly: true, wordWrap: 'on', wrappingIndent: 'indent', language: 'logLang' }" />
            <div v-else-if="!loading" class="p-text-italic">{{ $t('managers.logManagement.FileContentMissing') }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'

const API_BASE = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/2.0/resources/logs`

export default defineComponent({
    name: 'LogDetail',
    components: { ProgressBar, knMonaco, Button },
    props: {
        file: { type: Object as any, default: null }
    },
    emits: ['close'],
    data() {
        return {
            content: '' as string,
            loading: false as boolean
        }
    },
    watch: {
        file: {
            immediate: true,
            handler(newVal: any) {
                this.loadFileContent(newVal)
            }
        }
    },
    methods: {
        async loadFileContent(file: any) {
            this.content = ''
            if (!file || !file.name) return
            this.loading = true
            try {
                const url = file.folderName ? `${API_BASE}/folders/${encodeURIComponent(file.folderName)}/files/${encodeURIComponent(file.name)}` : `${API_BASE}/root/${encodeURIComponent(file.name)}`
                const resp = await (this as any).$http.get(url, { responseType: 'text' })
                const data = resp && resp.data !== undefined ? resp.data : resp
                this.content = data == null ? '' : data
            } catch (e: any) {
                this.content = ''
            } finally {
                this.loading = false
            }
        }
    }
})
</script>

<style scoped lang="scss">
// --- FILE VIEWER ---
.log-detail {
    display: flex;
    flex-direction: column;
    height: 100%;

    .file-viewer-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        overflow: auto;
        box-sizing: border-box;

        .file-viewer__editor {
            flex: 1 1 auto;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            overflow: auto;
        }
    }
}
</style>
