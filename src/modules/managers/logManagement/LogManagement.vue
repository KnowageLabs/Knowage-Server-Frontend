<template>
    <div class="kn-page">
        <div class="kn-page-content row p-m-0">
            <div class="col-3 column p-p-0">
                <q-toolbar class="kn-toolbar kn-toolbar--primary">
                    <q-toolbar-title> {{ $t('managers.logManagement.title') }}</q-toolbar-title>

                    <q-btn flat round dense icon="refresh" data-test="refresh-button" @click="loadPage(showHint, formVisible)">
                        <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.refresh') }}</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="download" data-test="download-button" @click="sidebarDownloadClicked">
                        <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.download') }}</q-tooltip>
                    </q-btn>
                </q-toolbar>
                <div class="filter-box">
                    <div class="row">
                        <q-input v-model="filter" class="q-pa-sm col" outlined dense square debounce="300" :placeholder="$t('common.search')">
                            <template v-slot:append>
                                <q-icon name="search" />
                            </template>
                        </q-input>

                        <q-btn flat round icon="event" class="q-ma-sm">
                            <q-menu :auto-close="false">
                                <q-card class="date-card">
                                    <q-card-section class="q-pa-none">
                                        <q-date flat v-model="dateSelection" multiple />
                                    </q-card-section>
                                    <q-card-actions class="justify-end">
                                        <q-btn :label="$t('common.reset')" color="secondary" @click="resetDateSelection" />
                                        <q-btn :label="$t('common.filter')" color="primary" v-close-popup />
                                    </q-card-actions>
                                </q-card>
                            </q-menu>
                        </q-btn>
                    </div>
                </div>
                <div class="tree-container column">
                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

                    <div class="tree-box">
                        <q-tree v-if="treeNodes" dense :nodes="treeNodes" node-key="key" label-key="label" children-key="children" tick-strategy="leaf" v-model:ticked="tickedFiles" v-model:selected="selectedNode" @update:selected="onTreeSelected" selection="single" selected-color="accent" default-expand-all>
                            <template #default-header="{ node }">
                                <div class="row full-width treeButtons" role="button">
                                    <q-icon v-if="node.icon" :name="node.icon" class="q-mr-sm" size="sm" />
                                    <div class="col">
                                        <div class="file-label">{{ node.label }}</div>
                                        <div v-if="node.lastModified" class="file-meta">{{ formatDate(node.lastModified) }}</div>
                                    </div>
                                </div>
                            </template>
                        </q-tree>
                    </div>
                </div>
            </div>

            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-page">
                <KnHint v-if="showHint" :title="$t('managers.logManagement.title')" :hint="$t('managers.logManagement.hint')"></KnHint>
                <LogManagementDetail v-else :file="currentRootFile" @close="closeRootViewer" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import KnHint from '@/components/UI/KnHint.vue'
import LogManagementDetail from './LogManagementDetail.vue'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'
import { downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'

const API_BASE = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/2.0/resources/logs`

export default defineComponent({
    name: 'log-management',
    components: { Button, ProgressBar, KnHint, LogManagementDetail },
    data() {
        const today = new Date()
        const todayYMD = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
        return {
            filter: '' as string,
            loading: false as boolean,
            dateSelection: [todayYMD] as string[],
            selectedNode: null as string | null,
            // model
            filesRoot: [] as Array<any>,
            folders: [] as Array<any>,
            // selection/ticks
            tickedFiles: [] as Array<string>,
            // viewer
            currentRootFile: null as any,
            // ui flags
            showHint: true as boolean,
            formVisible: false as boolean
        }
    },
    mounted() {
        // initial loads
        this.loadRootFiles()
        this.loadFolders()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo', 'setLoading']),

        // --- HELPERS ---
        async fetchData(url: string, opts: any = {}) {
            const resp: AxiosResponse<any> = await this.$http.get(url, opts)
            return resp && resp.data ? resp.data : resp
        },

        unwrapArray(payload: any): any[] {
            if (!payload) return []
            if (Array.isArray(payload)) return payload
            if (Array.isArray(payload.files)) return payload.files
            if (payload.root && Array.isArray(payload.root)) {
                const rootNode = payload.root[0]
                if (Array.isArray(rootNode?.children)) return rootNode.children
            }
            if (Array.isArray(payload.children)) return payload.children
            for (const k of Object.keys(payload || {})) {
                if (Array.isArray(payload[k])) return payload[k]
            }
            return []
        },

        normalizeFile(f: any) {
            return {
                ...f,
                name: f.name ?? f.fileName ?? f.filename ?? f.path,
                size: f.size ?? f.length ?? 0,
                lastModified: f.lastModified ?? null
            }
        },

        normalizeFilesArray(arr: any[]) {
            return (arr || [])
                .map((f: any) => this.normalizeFile(f))
                .filter((f: any) => {
                    const name = f && f.name ? String(f.name).toLowerCase() : ''
                    return !name.endsWith('.swp')
                })
        },

        // --- LOADERS ---
        async loadRootFiles() {
            this.loading = true
            try {
                const payload = await this.fetchData(`${API_BASE}/root`)
                const arr = this.unwrapArray(payload)
                this.filesRoot = this.normalizeFilesArray(arr)
            } finally {
                this.loading = false
            }
        },

        async loadFolders() {
            this.loading = true
            try {
                const payload = await this.fetchData(`${API_BASE}/folders`)
                const foldersArr = this.unwrapArray(payload)

                // inizializza array folders (senza files)
                const initialFolders = (foldersArr || []).map((f: any) => {
                    const name = f.label ?? f.name ?? f.folderName ?? f.key ?? 'unknown'
                    return { name, key: f.key ?? name, files: [], expanded: false, loading: false, count: 0 }
                })

                // start parallel fetches (non bloccare l'inizializzazione dell'array)
                const fetchPromises = initialFolders.map(async (folder) => {
                    try {
                        const payloadFiles = await this.fetchData(`${API_BASE}/folders/${encodeURIComponent(folder.name)}/files`)
                        const arr = this.unwrapArray(payloadFiles)
                        const normalized = this.normalizeFilesArray(arr)
                        return { key: folder.key, files: normalized, count: normalized.length }
                    } catch (err) {
                        console.warn('[LogManagement] loadFolderFiles failed for', folder.name, err)
                        return { key: folder.key, files: [], count: 0 }
                    }
                })

                // await tutte le risposte
                const results = await Promise.all(fetchPromises)

                // applica i risultati una sola volta costruendo il nuovo array
                const merged = initialFolders.map((f) => {
                    const res = results.find((r) => String(r.key) === String(f.key))
                    return { ...f, files: res ? res.files : [], count: res ? res.count : 0 }
                })

                this.folders = merged

                // mantenere tickedFiles coerente
                const validLeafKeys = new Set<string>()
                for (const rf of this.filesRoot || []) if (rf && rf.name) validLeafKeys.add(`root/${rf.name}`)
                for (const folder of this.folders || []) for (const ff of folder.files || []) if (ff && ff.name) validLeafKeys.add(`${folder.name}/${ff.name}`)
                this.tickedFiles = (this.tickedFiles || []).filter((k) => validLeafKeys.has(k))
            } finally {
                this.loading = false
            }
        },

        async loadFolderFiles(folder: any) {
            if (!folder || !folder.name) return
            folder.loading = true
            try {
                const payload = await this.fetchData(`${API_BASE}/folders/${encodeURIComponent(folder.name)}/files`)
                const arr = this.unwrapArray(payload)
                const normalized = this.normalizeFilesArray(arr)
                folder.files = normalized
                folder.count = normalized.length
            } finally {
                folder.loading = false
            }
        },

        async loadPage(showHint?: boolean, formVisible?: boolean) {
            this.showHint = showHint !== undefined ? showHint : this.showHint
            this.formVisible = formVisible !== undefined ? formVisible : this.formVisible
            try {
                this.loading = true
                await Promise.all([this.loadRootFiles(), this.loadFolders()])
            } finally {
                this.loading = false
            }
        },

        formatDate(value: any): string {
            if (!value) return ''
            const d = value instanceof Date ? value : new Date(value)
            if (isNaN(d.getTime())) return String(value)
            return d.toLocaleString()
        },

        toYMD(d: any): string {
            const dt = new Date(d)
            if (isNaN(dt.getTime())) return ''
            const y = dt.getFullYear()
            const m = String(dt.getMonth() + 1).padStart(2, '0')
            const day = String(dt.getDate()).padStart(2, '0')
            return `${y}/${m}/${day}`
        },

        resetDateSelection() {
            const today = new Date()
            const todayYMD = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
            this.dateSelection = [todayYMD]
        },

        // --- VIEWER ---
        selectFile(file: any, folderName?: string) {
            if (!file) return
            this.currentRootFile = { ...file, folderName: folderName || file?.folderName || null }
            this.showHint = false
        },

        onTreeSelected(sel: string | string[]) {
            const key = Array.isArray(sel) ? sel[0] : sel
            if (!key) return

            if (String(key).startsWith('root/')) {
                const name = String(key).substring('root/'.length)
                const file = this.filesRoot.find((f: any) => f.name === name)
                if (file) {
                    this.selectedNode = String(key)
                    this.selectFile(file)
                }
                return
            }

            const parts = String(key).split('/')
            if (parts.length >= 2) {
                const folderName = parts[0]
                const fileName = parts.slice(1).join('/')
                const folder = this.folders.find((f: any) => f.name === folderName || String(f.key) === folderName)
                const file = folder?.files?.find((ff: any) => ff.name === fileName)
                if (folder && file) {
                    this.selectedNode = String(key)
                    this.selectFile(file, folder.name)
                }
                return
            }
        },

        closeRootViewer() {
            this.currentRootFile = null
            this.selectedNode = null
            this.showHint = true
            this.formVisible = false
        },

        // --- TICK / SELECTION LOGIC ---
        getSelectedfileKeys(): string[] {
            return (this.tickedFiles || []).filter((k) => typeof k === 'string' && k.includes('/'))
        },

        // --- DOWNLOAD ---
        async sidebarDownloadClicked() {
            const keys = this.getSelectedfileKeys()
            if (!keys || keys.length === 0) {
                this.setInfo({
                    title: this.$t('common.info.noElementSelected'),
                    msg: this.$t('managers.logManagement.noFilesSelected')
                })
                return
            }

            const normalized = (keys || []).map((k) => (typeof k === 'string' && k.startsWith('root/') ? k.substring('root/'.length) : k))
            const payload = { selectedLogsNames: normalized }
            console.log('[LogManagement] download payload', payload)

            this.loading = true
            try {
                const url = `${API_BASE}/download`
                const resp: AxiosResponse<any> = await this.$http.post(url, payload, {
                    responseType: 'arraybuffer',
                    transformResponse: []
                })

                downloadDirectFromResponseWithCustomName(resp, 'logs.zip')
            } catch (err: any) {
                this.setError({
                    title: this.$t('common.error.downloading'),
                    msg: err?.message ?? String(err)
                })
            } finally {
                this.loading = false
            }
        }
    },

    computed: {
        treeNodes(): any[] {
            const nodes: any[] = []
            const q = (this.filter || '').toLowerCase()
            const sel = this.dateSelection || []

            const matchesSelection = (file: any) => {
                if (!sel || sel.length === 0) return true
                const fileYMD = this.toYMD(file?.lastModified || file?.modified)
                return !!fileYMD && sel.includes(fileYMD)
            }

            const rootFiles = (this.filesRoot || []).filter((f: any) => {
                const nameMatch = !q || (f.name || '').toLowerCase().includes(q)
                const dateMatch = matchesSelection(f)
                return nameMatch && dateMatch
            })
            rootFiles.sort((a: any, b: any) => {
                const ta = a?.lastModified ? new Date(a.lastModified).getTime() : 0
                const tb = b?.lastModified ? new Date(b.lastModified).getTime() : 0
                return tb - ta
            })
            if (rootFiles.length > 0) {
                const rootChildren = rootFiles.map((f: any) => ({ key: `root/${f.name}`, label: f.name, type: 'file', root: true, lastModified: f.lastModified }))
                nodes.push({ key: 'root-files-group', label: 'Root Files', icon: 'folder', type: 'group', children: rootChildren })
            }

            for (const folder of this.folders || []) {
                const matching = (folder.files || []).filter((f: any) => {
                    const nameMatch = !q || (f.name || '').toLowerCase().includes(q)
                    const dateMatch = matchesSelection(f)
                    return nameMatch && dateMatch
                })
                matching.sort((a: any, b: any) => {
                    const ta = a?.lastModified ? new Date(a.lastModified).getTime() : 0
                    const tb = b?.lastModified ? new Date(b.lastModified).getTime() : 0
                    return tb - ta
                })
                if (matching.length === 0) continue
                const children = matching.map((f: any) => ({ key: `${folder.name}/${f.name}`, label: f.name, type: 'file', folderName: folder.name, lastModified: f.lastModified }))
                nodes.push({ key: folder.key || folder.name, label: folder.name, icon: 'folder', type: 'folder', children })
            }

            return nodes
        }
    }
})
</script>

<style lang="scss" scoped>
// --- SIDEBAR ---
.col-3.column {
    min-width: 0;
    box-sizing: border-box;

    .kn-toolbar {
        .toolbar-actions {
            display: flex;
            gap: 0.5rem;
            margin-left: auto;
            align-items: center;
        }
    }

    .filter-box {
        align-items: center;
        border: 1px solid var(--kn-list-border-color);
        flex: 0 0 auto;
        padding: 0;
        background: var(--kn-sidebar-bg, transparent);
        box-sizing: border-box;
    }

    .tree-container {
        border: 1px solid var(--kn-list-border-color);
        flex: 1 0 0;
        max-width: 100%;
        box-sizing: border-box;
        overflow: auto;

        .tree-box {
            flex: 1 1 0;
            min-height: 0;
            direction: rtl;
            overflow: auto;
            box-sizing: border-box;

            .q-tree {
                direction: ltr;
                display: inline-block;
                min-width: max-content;
                box-sizing: border-box;
                width: 100%;
            }

            .treeButtons {
                display: flex;
                align-items: center;
                width: 100%;
                box-sizing: border-box;
                border-radius: 6px;
                padding: 0.25rem 0.5rem;
                cursor: pointer;
            }
        }

        .q-tree__node__content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            white-space: nowrap;
            box-sizing: border-box;
        }

        .q-tree__node__prefix,
        .q-tree__node__suffix {
            flex: 0 0 auto;
            box-sizing: border-box;
        }

        .q-tree__node__label,
        .file-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }

        .file-label {
            line-height: 1;
        }

        .file-meta {
            font-size: 0.75rem;
            color: var(--kn-text-secondary-color, #888);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}

// --- RESPONSIVE ---
@media (max-width: 480px) {
    .file-name {
        font-size: 0.95rem;
    }
}
</style>
