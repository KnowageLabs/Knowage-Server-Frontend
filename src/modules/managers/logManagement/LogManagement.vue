<template>
    <div class="kn-page">
        <div class="kn-page-content p-grid p-m-0">
            <div class="p-col-4 p-sm-4 p-md-3 p-p-0 column">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        <div class="kn-toolbar__title">Log Management</div>
                    </template>
                    <template #end>
                        <Button icon="fas fa-sync-alt" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" @click="loadPage(showHint, formVisible)" />
                    </template>
                </Toolbar>
                <div class="column sidebar-inner" style="border: 1px solid var(--kn-list-border-color); flex: 1 0 0; position: relative;">
                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                    <LogManagementMetadataDialog v-model:visibility="displayMetadataDialog" v-model:id="metadataKey"></LogManagementMetadataDialog>
                    <LogManagementCreateFolderDialog v-model:visibility="folderCreation" :path="selectedFolder ? selectedFolder.relativePath : ''" @createFolder="createFolder" />

                    <q-input v-model="filter" class="q-ma-sm" outlined dense square debounce="300" :placeholder="$t('common.search')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>

                    <div class="sidebar-top-actions" aria-hidden="true">
                        <Button icon="pi pi-download" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" :aria-label="$t('common.download')" @click="sidebarDownloadClicked" data-test="sidebar-download-button" />
                    </div>

                    <section class="p-m-2">
                        <!--<div class="collapsible-header p-d-flex p-js-between p-ai-center" role="button" tabindex="0" @click="toggleRootFiles" @keyup.enter="toggleRootFiles" :aria-expanded="rootExpanded">
                            <div class="p-d-flex p-ai-center">
                                <q-icon :name="rootExpanded ? 'expand_more' : 'chevron_right'" class="p-mr-sm" />
                                <strong>Root Files</strong>
                            </div>
                            <div class="header-actions p-d-flex p-ai-center">
                                <input type="checkbox" class="header-select-checkbox" :checked="allRootSelected" @click.stop @change.stop="setRootSelection($event.target.checked)" :title="$t('common.selectAll')" />
                            </div>
                        </div>

                        <transition name="slide-vertical">
                            <ul class="files-list" v-show="rootExpanded && filteredRootFiles && filteredRootFiles.length">
                                <li v-for="file in filteredRootFiles" :key="file.name" class="root-file-row" @click="openRootFile(file)" title="Click to open">
                                    <span class="file-name">{{ file.name }}</span>
                                    <input type="checkbox" class="file-select-checkbox" :title="$t('common.select')" v-model="selectedFiles['root/' + file.name]" @click.stop />
                                </li>
                            </ul>
                        </transition>

                        <div v-if="(!filteredRootFiles || filteredRootFiles.length === 0) && !loading" class="p-mt-md p-text-italic">No files found</div>

                        <q-tree :nodes="folders" node-key="key" label-key="name" children-key="files" default-expand-all v-model:ticked="tickedFiles" tick-strategy="strict"></q-tree>
                        {{folders}}
                        <ul class="folders-list-items">
                            <li v-for="folder in folders" :key="folder.name" class="folder-item">
                                <div class="collapsible-header p-d-flex p-js-between p-ai-center" role="button" tabindex="0" @click="toggleFolder(folder)" @keyup.enter="toggleFolder(folder)" :aria-expanded="folder.expanded">
                                    <div class="p-d-flex p-ai-center">
                                        <q-icon :name="folder.expanded ? 'expand_more' : 'chevron_right'" class="p-mr-sm" />
                                        <strong class="folder-name">{{ folder.name }}</strong>
                                    </div>
                                    <div class="header-actions p-d-flex p-ai-center">
                                        <input type="checkbox" class="header-select-checkbox" :checked="isAllFolderSelected(folder)" @click.stop @change.stop="setFolderSelection(folder, $event.target.checked)" :title="$t('common.selectAll')" />
                                    </div>
                                </div>

                                <transition name="slide-vertical">
                                    <ul class="files-list" v-show="folder.expanded && folder.files && folder.files.length">
                                        <li v-for="file in folder.files.filter(f => !filter || (f.name || '').toLowerCase().includes(filter.toLowerCase()))" :key="file.name" class="folder-file-row" @click.stop="openFolderFile(folder, file)">
                                            <span class="file-name">{{ file.name }}</span>
                                            <input type="checkbox" class="file-select-checkbox" :title="$t('common.select')" v-model="selectedFiles[folder.name + '/' + file.name]" @click.stop />
                                        </li>
                                    </ul>
                                </transition>
                            </li>
                        </ul>-->
                        <q-tree :nodes="treeNodes" node-key="key" label-key="label" children-key="children" tick-strategy="strict" :ticked.sync="tickedFiles" default-expand-all @update:ticked="onTreeTickedUpdate">
                            <template #default-header="{ node }">
                                <div class="row full-width treeButtons">
                                    <q-icon v-if="node.icon" :name="node.icon" class="q-mr-sm" size="sm" />
                                    <span class="col kn-truncated">{{ node.label }}</span>

                                    <!--<q-btn v-if="node.type === 'file'" flat round dense size="xs" icon="visibility" @click.stop="openTreeFile(node)">
                                        <q-tooltip :delay="200">{{ $t('common.open') }}</q-tooltip>
                                    </q-btn>
                                    <q-btn v-if="node.type === 'file'" flat round dense size="xs" icon="download" @click.stop="downloadSingle(node)">
                                        <q-tooltip :delay="200">{{ $t('common.download') }}</q-tooltip>
                                    </q-btn>

                                    <q-btn v-if="node.type === 'folder'" flat round dense size="xs" icon="download" @click.stop="downloadDirect(node)">
                                        <q-tooltip :delay="200">{{ $t('common.download') }}</q-tooltip>
                                    </q-btn>

                                    <q-btn flat round dense size="xs" icon="more_vert" @click.stop.prevent="menuOpen[node.key] = true" aria-haspopup="true" :aria-label="$t('common.actions')" />

                                    <q-menu v-model="menuOpen[node.key]" anchor="top right" self="top right" @hide="menuOpen[node.key] = false">
                                        <q-list style="min-width: 160px">
                                            <q-item clickable v-close-popup @click="onMenuSelectAll(node)">
                                                <q-item-section>{{ $t('common.selectAll') }}</q-item-section>
                                            </q-item>
                                            <q-item clickable v-close-popup @click="onMenuDeselectAll(node)">
                                                <q-item-section>{{ $t('common.deselectAll') }}</q-item-section>
                                            </q-item>
                                            <q-item clickable v-close-popup v-if="node.type === 'file'" @click="downloadSingle(node)">
                                                <q-item-section>{{ $t('common.download') }}</q-item-section>
                                            </q-item>
                                            <q-item clickable v-close-popup v-if="node.type === 'folder' || node.type === 'group'" @click="onMenuDownload(node)">
                                                <q-item-section>{{ $t('common.download') }}</q-item-section>
                                            </q-item>
                                            <q-separator />
                                            <q-item clickable v-close-popup v-if="node.type === 'folder'" @click="onMenuDelete(node)">
                                                <q-item-section class="text-negative">{{ $t('common.delete') }}</q-item-section>
                                            </q-item>
                                        </q-list>
                                    </q-menu>-->
                                </div>
                            </template>
                        </q-tree>
                    </section>
                </div>
            </div>
            
            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-page">
                <KnHint v-if="showHint" :title="$t('managers.logManagement.title')" :hint="$t('managers.logManagement.hint')"></KnHint>

                <!--<div v-if="rootFileContentVisible" class="root-file-viewer">
                    <Toolbar class="file-toolbar kn-toolbar kn-toolbar--secondary">
                        <template #start>
                            <div class="kn-toolbar__title file-title">{{ currentRootFile?.name }}</div>
                        </template>
                        <template #end>
                            <div class="file-toolbar-actions">
                                <Button icon="pi pi-times" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" @click="closeRootViewer" />
                            </div>
                        </template>
                    </Toolbar>
                    <div class="file-viewer-body p-m-3">
                        <pre class="file-viewer">{{ currentRootFileContent ?? $t('managers.logManagement.emptyFile') }}</pre>
                    </div>
                </div>-->

                <LogManagementDetail v-if="formVisible" :folder="selectedFolder" :parent-key="folderParentKey" @touched="touched = true" @close="onClose" @inserted="loadPage($event)" @folderCreated="loadPage" @closed="switchToHint()" @fileUploaded="loadPage(false, true)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import descriptor from './LogManagementDescriptor.json'
import Tree from 'primevue/tree'
import { IFolderTemplate, IFileTemplate } from '@/modules/managers/logManagement/LogManagement'
import { downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'
import { formatDate } from '@/helpers/commons/localeHelper'
import LogManagementMetadataDialog from '@/modules/managers/logManagement/LogManagementMetadataDialog.vue'
import LogManagementDetail from './LogManagementDetail.vue'
import KnHint from '@/components/UI/KnHint.vue'
import LogManagementCreateFolderDialog from './LogManagementCreateFolderDialog.vue'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'
import { COMMON_AXIS_PROPERTIES_INDEX } from 'vega-lite/build/src/axis'

export default defineComponent({
    name: 'log-management',
    components: { KnHint, LogManagementMetadataDialog, LogManagementCreateFolderDialog, LogManagementDetail, Tree },
    data() {
        return {
            descriptor,
            displayMetadataDialog: false,
            loading: false,
            nodes: [] as IFolderTemplate[],
            expandedKeys: {},
            selectedKeys: null,
            metadataKey: null,
            dirty: false,
            buttonsVisible: [],
            showHint: true,
            touched: false,
            selectedFolder: {} as IFolderTemplate,
            folderCreation: false,
            formVisible: false,
            filter: '' as string,
            filesRoot: [] as Array<IFileTemplate>,
            folders: [] as Array<{ name: string; key?: string; files?: IFileTemplate[]; expanded?: boolean; loading?: boolean }>,
            selectedRootFilesMap: {} as Record<string, boolean>,
            selectedFiles: {} as Record<string, boolean>,
            tickedFiles: [] as any[],
            currentRootFile: null as IFileTemplate | null,
            currentRootFileContent: '' as string | null,
            rootExpanded: false,
        }
    },
    async created() {
        this.loadPage()
        this.loadRootFiles()
        this.loadFolders()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        
        onRefresh() {
            this.loadPage(this.showHint, this.formVisible)
            this.loadRootFiles()
        },
        toggleRootFiles() {
            this.rootExpanded = !this.rootExpanded
        },
        fileKey(folderName: string | null, fileName: string) {
            return folderName ? `${folderName}/${fileName}` : `root/${fileName}`
        },
        setRootSelection(checked: boolean) {
            if (!this.filesRoot) return
            for (const f of this.filesRoot) {
                const k = 'root/' + f.name
                try {
                    this.selectedFiles[k] = checked
                } catch (e) {
                    console.warn('[LogManagement] setRootSelection fallback assign', e)
                    ;(this.selectedFiles as any)[k] = checked
                }
            }
        },
        isAllFolderSelected(folder: any): boolean {
            if (!folder || !folder.files || folder.files.length === 0) return false
            return folder.files.every((f: any) => {
                const k = folder.name + '/' + f.name
                return !!this.selectedFiles[k]
            })
        },
        setFolderSelection(folder: any, checked: boolean) {
            if (!folder || !folder.files) return
            for (const f of folder.files) {
                const k = folder.name + '/' + f.name
                try {
                    this.selectedFiles[k] = checked
                } catch (e) {
                    console.warn('[LogManagement] setFolderSelection fallback assign', e)
                    ;(this.selectedFiles as any)[k] = checked
                }
            }
        },
        async loadRootFiles() {
            this.loading = true
            try {
                const response: AxiosResponse<any> = await this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/root`)
                const payload = response && response.data ? response.data : response
                this.filesRoot = Array.isArray(payload) ? payload.map((f: any) => ({ ...f, name: f.name ?? f.fileName ?? f.filename ?? f.path })) : []
                for (const file of this.filesRoot) {
                    const k = 'root/' + file.name
                    ;(this.selectedFiles as any)[k] = this.selectedFiles[k] ?? false
                }
                this.tickedFiles = this.getSelectedfileKeys()
            } catch (err) {
                console.error('[LogManagement] loadRootFiles error', err)
                this.setError({ title: this.$t('common.error'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
            } finally {
                this.loading = false
            }
        },
        filteredRootFiles() {
            if (!this.filter) {
                return this.filesRoot
            }
            const q = (this.filter || '').toLowerCase()
            return this.filesRoot.filter((file: any) => (file.name || '').toLowerCase().includes(q))
        },
        async openRootFile(file: IFileTemplate) {
            if (!file) return
            this.currentRootFile = file
            this.rootFileContentVisible = true
            this.currentRootFileContent = null
            this.loading = true
            try {
                const resp: AxiosResponse<any> = await this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/root/${encodeURIComponent(file.name)}`, { responseType: 'text' })
                this.currentRootFileContent = resp.data
                this.showHint = false
                this.formVisible = false
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[LogManagement] openRootFile error', err)
                this.setError({
                    title: this.$t('common.error.downloading'),
                    msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh')
                })
            } finally {
                this.loading = false
            }
        },
        async sidebarDownloadClicked() {
            const keys = this.getSelectedfileKeys && typeof this.getSelectedfileKeys === 'function' ? this.getSelectedfileKeys() : []
            if (!keys || keys.length === 0) {
                this.setInfo({ title: this.$t('common.info'), msg: this.$t('managers.logManagement.noFilesSelected') ?? 'No files selected for download' })
                return
            }

            // payload as array of strings (backend may expect ["root/name","folder/name",...])
            const payload = keys

            // debug: payload
            // eslint-disable-next-line no-console
            console.log('[LogManagement] download payload (array)', payload)

            this.loading = true
            try {
                const url = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/2.0/resources/logs/download`
                const resp: AxiosResponse<any> = await this.$http.post(
                    url,
                    payload,
                    {
                        responseType: 'arraybuffer',
                        transformResponse: [(data) => data],
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/zip; charset=utf-8'
                        }
                    }
                )

                const contentType = (resp && resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || ''
                if (!/zip|octet-stream|application\/zip|application\/octet-stream/i.test(contentType || '')) {
                    let text = ''
                    try { text = new TextDecoder('utf-8').decode(resp.data) } catch (e) { text = String(resp.data) }
                    // eslint-disable-next-line no-console
                    console.error('[LogManagement] download returned non-zip payload', contentType, text)
                    this.setError({ title: this.$t('common.error.downloading'), msg: text || this.$t('common.error.refresh') })
                    return
                }

                // valid binary -> download
                // eslint-disable-next-line no-console
                console.log('[LogManagement] download response', resp && resp.status)
                downloadDirectFromResponseWithCustomName(resp, 'logs.zip')
            } catch (err: any) {
                // eslint-disable-next-line no-console
                console.error('[LogManagement] sidebarDownloadClicked error', err)

                if (err && err.response && err.response.data) {
                    let msg = ''
                    try { msg = new TextDecoder('utf-8').decode(err.response.data) } catch (decodeErr) { msg = err?.message ? String(err.message) : JSON.stringify(err) }
                    this.setError({ title: this.$t('common.error.downloading'), msg: msg || this.$t('common.error.refresh') })
                } else {
                    this.setError({ title: this.$t('common.error.downloading'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
                }
            } finally {
                this.loading = false
            }
        },
        async downloadRootSelected() {
            const names = Object.keys(this.selectedRootFilesMap).filter((k) => this.selectedRootFilesMap[k])
            if (names.length === 0) {
                // if current file is open download it alone
                if (this.currentRootFile) names.push(this.currentRootFile.name)
                else return
            }
            this.loading = true
            try {
                const payload = { paths: names.map((n) => ({ root: true, name: n })) }
                const resp: AxiosResponse<any> = await this.$http.post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/download`, payload, { responseType: 'arraybuffer' })
                downloadDirectFromResponseWithCustomName(resp, 'logs.zip')
            } catch (err) {
                this.setError({ title: this.$t('common.error.downloading'), msg: this.$t(err) })
            } finally {
                this.loading = false
            }
        },
        formatDataValue(value: number | string | undefined) {
            if (!value) return ''
            try{
                return formatDate(value, 'LLL')
            } catch {
                return '' + value
            }
        },
        formatSize(size: number | string | undefined)   {
            if (!size && size !== 0) return ''
            return (size + '').toString()
        },
        createFolder(folderName: string) {
            if (folderName && this.selectedFolder) {
                const obj = {} as JSON
                obj['key'] = '' + this.selectedFolder.key
                obj['folderName'] = folderName
                this.$http
                    .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders`, obj, {
                        responseType: 'arraybuffer',

                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(() => {
                        this.$emit('folderCreated', true)
                    })
                    .catch((error) => {
                        this.setError({
                            title: this.$t('common.error.saving'),
                            msg: this.$t(error)
                        })
                    })
                    .finally(() => {
                        this.loading = false
                        this.openCreateFolderDialog()
                        this.loadPage(this.showHint, this.formVisible)
                    })
            }
        },
        getCurrentFolderPath() {
            return this.selectedFolder ? this.selectedFolder.relativePath : undefined
        },
        getCurrentFolderKey() {
            return this.selectedFolder ? '' + this.selectedFolder.key : undefined
        },
        getButtonClass(node) {
            let visibility = ' kn-hide'
            if (this.buttonsVisible[node.key] && !node.edit) visibility = ''
            return 'p-button-text p-button-sm p-button-rounded p-button-plain p-p-0' + visibility
        },
        openCreateFolderDialog() {
            this.folderCreation = !this.folderCreation
        },
        toggleInput(node) {
            if (node.level > 0) {
                if (node.edit && node.label !== node.edit) {
                    if (this.selectedFolder) {
                        const obj = {} as JSON
                        obj['key'] = this.selectedFolder.key
                        obj['folderName'] = node.label
                        this.loading = true
                        this.$http
                            .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders/update`, obj, {
                                responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then(() => {
                                delete node.edit
                                this.setInfo({
                                    title: this.$t('managers.resoruceManagement.renameFolder'),
                                    msg: this.$t('managers.resoruceManagement.folderRenamedSuccessfully')
                                })
                            })
                            .catch((error) => {
                                this.setError({
                                    title: this.$t('managers.resoruceManagement.renameFolder'),
                                    msg: this.$t(error)
                                })
                            })
                            .finally(() => {
                                this.loading = false
                            })
                    }
                } else node.edit = node.label
            }
        },
        addIcon(nodes) {
            for (const idx in nodes) {
                const node = nodes[idx]
                node.icon = 'folder'
                if (node.children && node.children.length > 0) {
                    this.addIcon(node.children)
                }
            }
        },
        loadPage(showHint?, formVisible?): void {
            this.loading = true
            this.showHint = showHint != undefined ? showHint : true
            this.formVisible = formVisible != undefined ? formVisible : false
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders`)
                .then((response: AxiosResponse<any>) => {
                    try {
                        const data = response && response.data ? response.data : {}
                        const rootArr = Array.isArray(data.root) ? data.root : []
                        const root = rootArr[0] || { label: 'ROOT', children: [] }
                        root.label = 'ROOT'
                        root.icon = 'root'
                        this.addIcon(root.children || [])
                        this.nodes = rootArr.length ? data.root : [root]
                    } catch (e) {
                        console.error('[LogManagement] loadPage parse error', e, response)
                        this.setError({
                            title: this.$t('common.error'), msg: e?.message ?? this.$t('common.error.refresh')
                        })
                    } finally {
                        this.loading = false
                    }
                })
                .catch((err) => {
                    console.error('[LogManagement] loadPage request error', err)
                    this.setError({
                        title: this.$t('common.error'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh')
                    })
                })
        },
        openMetadataDialog(node): void {
            this.metadataKey = node.key
            this.displayMetadataDialog = !this.displayMetadataDialog
        },
        deleteFolder(node) {
            this.loading = true
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders`, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        key: node.key
                    }
                })
                .then(() => {
                    this.loadPage()
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                })
                .catch(() => {
                    this.setError({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteFailed')
                    })
                })
                .finally(() => (this.loading = false))
        },
        downloadDirect(node) {
            this.loading = true
            const obj = {} as JSON
            obj['key'] = node.key
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/download`, obj, {
                    responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    downloadDirectFromResponseWithCustomName(response, node.label + '.zip')
                })
                .finally(() => (this.loading = false))
        },
        setDirty(): void {
            this.dirty = true
        },
        findNodeById(tree, id) {
            for (const node of tree) {
                if (node.key === id) {
                    return node
                }
                if (node.children && node.children.length > 0) {
                    const foundNode = this.findNodeById(node.children, id)
                    if (foundNode) {
                        return foundNode
                    }
                }
            }
            return null
        },
        showForm(folderId: string) {
            let functionality: any
            if (folderId) {
                functionality = this.findNodeById(this.nodes, folderId)
            } else {
                functionality = {} as IFolderTemplate
            }
            /*             this.functionalityParentId = parentId */
            if (!this.touched) {
                this.setSelected(functionality)
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.setSelected(functionality)
                    }
                })
            }
        },
        setSelected(functionality: IFolderTemplate) {
            this.selectedFolder = functionality
            this.formVisible = true
            this.showHint = false
        },
        showDeleteDialog(node) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteFolder(node)
            })
        },
        switchToHint() {
            this.formVisible = false
            this.showHint = true

            this.expandedKeys = {}
            this.selectedKeys = null
            this.metadataKey = null
            this.dirty = false

            this.touched = false
            this.selectedFolder = {} as IFolderTemplate
        },
        closeRootViewer() {
            this.rootFileContentVisible = false
            this.currentRootFile = null
            this.currentRootFileContent = null
            this.showHint = true
        },
        async loadFolders() {
            this.loading = true
            try {
                const resp: AxiosResponse<any> = await this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders`)
                const payload = resp && resp.data ? resp.data : resp

                let foldersArray: any[] = []
                if (Array.isArray(payload)) {
                    foldersArray = payload
                } else if (payload && payload.root && Array.isArray(payload.root)) {
                    const rootNode = payload.root[0]
                    foldersArray = Array.isArray(rootNode?.children) ? rootNode.children : []
                } else if (Array.isArray(payload.children)) {
                    foldersArray = payload.children
                } else {
                    for (const k of Object.keys(payload || {})) {
                        if (Array.isArray(payload[k])) {
                            foldersArray = payload[k]
                            break
                        }
                    }
                }

                this.folders = (foldersArray || []).map((f: any) => {
                    const name = f.label ?? f.name ?? f.folderName ?? f.key ?? 'unknown'
                    const count = (f.files && Array.isArray(f.files) ? f.files.length : undefined) ?? (f.children && Array.isArray(f.children) ? f.children.length : undefined) ?? f.count ?? f.numberOfFiles ?? 0
                    return { name, key: f.key ?? name, files: [], expanded: false, loading: false, count }
                })
                // eslint-disable-next-line no-console
                console.log('[LogManagement] folders loaded', this.folders)
                try {
                    await Promise.all((this.folders || []).map(async (folder: any) => {
                        try {
                            await this.loadFolderFiles(folder)
                        } catch (e) {
                            // eslint-disable-next-line no-console
                            console.warn('[LogManagement] loadFolders loadFolderFiles error', folder, e)
                        }
                    }))
                    this.tickedFiles = this.getSelectedfileKeys()
                } catch (e) {
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[LogManagement] loadFolders error', err)
                this.setError({
                    title: this.$t('common.error'),
                    msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh')
                })
            } finally {
                this.loading = false
            }
        },

        async toggleFolder(folder: any) {
            folder.expanded = !folder.expanded
            if (folder.expanded && (!folder.files || folder.files.length === 0)) {
                if (folder.count === undefined) {
                    folder.count = 0
                }
                await this.loadFolderFiles(folder)
            }
        },

        async loadFolderFiles(folder: any) {
            folder.loading = true
            try {
                const resp: AxiosResponse<any> = await this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders/${encodeURIComponent(folder.name)}/files`)
                const payload = resp && resp.data ? resp.data : resp
                let filesArray: any[] = []
                if (Array.isArray(payload)) {
                    filesArray = payload
                } else if (Array.isArray(payload.files)) {
                    filesArray = payload.files
                } else {
                    for (const k of Object.keys(payload || {})) {
                        if (Array.isArray(payload[k])) {
                            filesArray = payload[k]
                            break
                        }
                    }
                }
                folder.files = (filesArray || []).map((f: any) => {
                    const name = f.name ?? f.fileName ?? f.filename ?? f.path ?? 'unknown'
                    const size = f.size ?? f.length ?? 0
                    const lastModified = f.lastModified ?? null
                    return { ...f, name, size, lastModified } as IFileTemplate
                })
                for (const f of folder.files) {
                    const k = folder.name + '/' + f.name
                    ;(this.selectedFiles as any)[k] = this.selectedFiles[k] ?? false
                }
                folder.count = folder.files.length
                this.tickedFiles = this.getSelectedfileKeys()
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[LogManagement] loadFolderFiles error', err)
                this.setError({
                    title: this.$t('common.error'),
                    msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh')
                })
            } finally {
                folder.loading = false
            }
        },
        getSelectedfileKeys() {
            return Object.keys(this.selectedFiles).filter((k) => !!this.selectedFiles[k])
        },
        async openFolderFile(folder: any, file: IFileTemplate) {
            if (!file) return
            this.currentRootFile = { ...file, name: file.name } as IFileTemplate
            this.rootFileContentVisible = true
            this.currentRootFileContent = null
            this.loading = true
            try {
                const resp: AxiosResponse<any> = await this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/logs/folders/${encodeURIComponent(folder.name)}/files/${encodeURIComponent(file.name)}`, { responseType: 'text' })
                this.currentRootFileContent = resp.data
                this.showHint = false
                this.formVisible = false
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[LogManagement] openFolderFile error', err)
                this.setError({
                    title: this.$t('common.error.downloading'),
                    msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh')
                })
            } finally {
                this.loading = false
            }
        },
        onTreeTickedUpdate(ticked: string[]) {
            this.tickedFiles = ticked || []
            this.selectedFiles = {}
            for (const k of this.tickedFiles) {
                try {
                    this.selectedFiles[k] = true
                } catch (e) {
                    ;(this.selectedFiles as any)[k] = true
                }
            }
        },
        openTreeFile(node: any) {
            if (!node) return
            if (node.root === true && node.fileObj) {
                this.openRootFile(node.fileObj)
                return
            }
            if (node.type === 'file' && node.folderName && node.fileObj) {
                this.openFolderFile({ name: node.folderName }, node.fileObj)
            }
        },
        async downloadSingle(node: any) {
            if (!node || node.type !== 'file') return
            const prevSelected = { ...(this.selectedFiles || {}) }
            try {
                this.selectedFiles = {}
                this.selectedFiles[node.key] = true
                await this.sidebarDownloadClicked()
            } finally {
                this.selectedFiles = prevSelected
                // refresh tickedFiles to reflect original selection
                this.tickedFiles = this.getSelectedfileKeys()
            }
        },
    },

    computed: {
        filteredRootFiles() {
            if (!this.filter) return this.filesRoot
            const q = (this.filter || '').toLowerCase()
            return this.filesRoot.filter((file: any) => (file.name || '').toLowerCase().includes(q))
        },
        allRootSelected: {
            get(): boolean {
                if (!this.filesRoot || this.filesRoot.length === 0) return false
                return this.filesRoot.every((f: any) => !!this.selectedFiles['root/' + f.name])
            },
            set(val: boolean) {
                this.setRootSelection(val)
            }
        },
        treeNodes(): any[] {
            const nodes: any[] = []

            if (this.filesRoot && this.filesRoot.length > 0) {
                const rootChildren = this.filesRoot.map((f: any) => ({
                    key: 'root/' + f.name,
                    label: f.name,
                    type: 'file',
                    root: true,
                    fileObj: f
                }))
                nodes.push({
                    key: 'root-files-group',
                    label: 'Root Files',
                    icon: 'folder',
                    type: 'group',
                    children: rootChildren
                })
            }

            if (this.folders && this.folders.length > 0) {
                for (const folder of this.folders) {
                    const children = (folder.files || []).map((f: any) => ({
                        key: (folder.name || folder.key) + '/' + f.name,
                        label: f.name,
                        type: 'file',
                        folderName: folder.name,
                        fileObj: f
                    }))
                    nodes.push({
                        key: folder.key || folder.name,
                        label: folder.name,
                        icon: 'folder',
                        type: 'folder',
                        children
                    })
                }
            }
            return nodes
        },
    }
})
</script>

<style lang="scss" scoped>
/* Layout generale */
.kn-page { height: 100vh; }
.kn-page-content { height: 100%; }

/* Sidebar container */
.sidebar-inner {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Search + button area: keep in normal flow */
.sidebar-top-actions {
  position: static;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.25rem 0.75rem 0 0;
  margin-top: 0.4rem;
  z-index: 2;
}
.sidebar-top-actions .p-button {
  height: 32px;
  min-width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
.sidebar-top-actions .p-button:hover {
  background: rgba(0,0,0,0.04);
  border-radius: 6px;
}

/* Scroll solo per la zona liste; scrollbar sul lato sinistro */
.sidebar-inner section.p-m-2 {
  direction: rtl;              /* sposta la scrollbar a sinistra */
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1 1 0;
  min-height: 0;
  padding-right: 8px;
}
.sidebar-inner section.p-m-2 > * {
  direction: ltr;
  text-align: left;
}

/* Webkit scrollbar styling */
.sidebar-inner section.p-m-2::-webkit-scrollbar { width: 10px; }
.sidebar-inner section.p-m-2::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 6px;
}
.sidebar-inner section.p-m-2::-webkit-scrollbar-track { background: transparent; }

/* Collapsible header (Root Files / Folder headers) */
.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}

/* Header actions: select-all checkbox + count badge */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.header-select-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Badge count */
.files-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 8px;
  margin-left: 0.5rem;
  border-radius: 999px;
  background: #9f25d3;
  color: #fff;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
  vertical-align: middle;
}

/* Liste e righe file - uniformate */
.files-list,
.folders-list-items {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0;
}

/* file rows: use flex to keep checkbox aligned on the right */
.root-file-row,
.folder-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--kn-list-border-color);
  cursor: pointer;
  min-width: 0;
}
.root-file-row:hover,
.folder-file-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* File name: truncate if too long, take available space */
.file-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px; /* space before checkbox */
}

/* Checkbox: inline, at the end of the row */
.file-select-checkbox {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-left: 8px;
  cursor: pointer;
}

/* Folder specific small tweaks */
.folder-item { margin-bottom: 0.25rem; }
.folder-name { font-weight: 600; }

/* Toolbar and viewer styles (kept consistent) */
.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--kn-border-color, #e6e6e6);
  background: var(--kn-sidebar-bg, transparent);
  color: inherit;
}
.file-title {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-toolbar-actions { display: flex; gap: 0.5rem; align-items: center; }
.file-viewer-body { padding-top: 1rem; }
.file-viewer {
  white-space: pre-wrap;
  max-height: calc(100vh - 200px);
  overflow: auto;
  background: #fff;
  border: 1px solid #e6e6e6;
  padding: 1rem;
}

/* transition (unchanged) */
.slide-vertical-enter-active,
.slide-vertical-leave-active {
  transition: max-height 220ms ease, opacity 200ms ease, padding 200ms ease;
}
.slide-vertical-enter-from,
.slide-vertical-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-vertical-enter-to,
.slide-vertical-leave-from {
  max-height: 800px;
  opacity: 1;
}

/* responsive tweak */
@media (max-width: 480px) {
  .sidebar-top-actions { margin-top: 0.6rem; }
  .file-name { font-size: 0.95rem; }
}
</style>