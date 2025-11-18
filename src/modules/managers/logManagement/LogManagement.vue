<template>
    <div class="kn-page">
        <div class="kn-page-content row p-m-0">
            <div class="col-3 column p-p-0">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        <div class="kn-toolbar__title">Log Management</div>
                    </template>
                    <template #end>
                        <Button icon="fas fa-sync-alt" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" @click="loadPage(showHint, formVisible)" />
                        <Button icon="pi pi-download" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" :aria-label="$t('common.download')" @click="sidebarDownloadClicked" data-test="sidebar-download-button" />
                    </template>
                </Toolbar>
                <div class="search-box">
                    <q-input v-model="filter" class="q-ma-sm" outlined dense square debounce="300" :placeholder="$t('common.search')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </div>
                <div class="tree-container column">
                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

                    <div class="tree-box">
                        <q-tree :nodes="treeNodes" node-key="key" label-key="label" children-key="children" tick-strategy="strict" :ticked.sync="tickedFiles" default-expand-all @update:ticked="onTreeTickedUpdate">
                            <template #default-header="{ node }">
                                <div class="row full-width treeButtons">
                                    <q-icon v-if="node.icon" :name="node.icon" class="q-mr-sm" size="sm" />
                                    <span class="col kn-truncated" @click.stop="node.type === 'file' && openTreeFile(node)" style="cursor: pointer;">{{ node.label }}</span>
                                </div>
                            </template>
                        </q-tree>
                    </div>
                </div>
            </div>
            
            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-page">
                <KnHint v-if="showHint" :title="$t('managers.logManagement.title')" :hint="$t('managers.logManagement.hint')"></KnHint>

                <LogManagementDetail v-if="formVisible" :folder="selectedFolder" :parent-key="folderParentKey" @touched="touched = true" @close="onClose" @inserted="loadPage($event)" @folderCreated="loadPage" @closed="switchToHint()" @fileUploaded="loadPage(false, true)" />

                <div v-if="!showHint && !formVisible && currentRootFile" class="root-file-viewer" style="display:flex;flex-direction:column;height:100%;">
                    <div class="file-toolbar kn-toolbar--secondary">
                        <div class="file-title">{{ currentRootFile?.name }}</div>
                        <div class="file-toolbar-actions">
                            <Button icon="pi pi-times" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" :aria-label="$t('common.close')" @click="closeRootViewer" />
                        </div>
                    </div>

                    <div class="file-viewer-body" style="padding:1rem; flex:1 1 auto; overflow:auto;">
                        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
                        <pre v-if="currentRootFileContent" class="file-viewer">{{ currentRootFileContent }}</pre>
                        <div v-else-if="!loading" class="p-text-italic">{{ $t('managers.logManagement.noContent') ?? 'No Content' }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios, { AxiosResponse } from 'axios'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import { QInput, QIcon, QTree } from 'quasar'
import KnHint from '@/modules/managers/logManagement/LogManagementHint.vue'
import LogManagementDetail from './LogManagementDetail.vue'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'
import { downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'

const API_BASE = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/2.0/resources/logs`

export default defineComponent({
  name: 'log-management',
  components: { Toolbar, Button, ProgressBar, QInput, QIcon, QTree, KnHint, LogManagementDetail },
  data() {
    return {
      filter: '' as string,
      loading: false as boolean,
      // model
      filesRoot: [] as Array<any>,
      folders: [] as Array<any>,
      // selection/ticks
      selectedFiles: {} as Record<string, boolean>, // keys: "root/name" or "folder/name"
      tickedFiles: [] as Array<string>,
      prevTickedFiles: [] as Array<string>,
      // viewer
      currentRootFile: null as any,
      currentRootFileContent: '' as string | null,
      // ui flags
      showHint: true as boolean,
      formVisible: false as boolean,
      selectedFolder: null as any,
      folderParentKey: undefined as unknown,
      touched: false as boolean,
      rootFileContentVisible: false as boolean
    }
  },
  mounted() {
    // initial loads
    this.loadRootFiles()
    this.loadFolders()
  },
  methods: {
    ...mapActions(mainStore, ['setError', 'setInfo']),

    // --- LOADERS ---
    async loadRootFiles() {
      this.loading = true
      try {
        const resp: AxiosResponse<any> = await axios.get(`${API_BASE}/root`)
        const payload = resp && resp.data ? resp.data : resp
        this.filesRoot = Array.isArray(payload) ? payload.map((f: any) => ({ ...f, name: f.name ?? f.fileName ?? f.filename ?? f.path })) : []
        // initialize selection map for root files
        for (const f of this.filesRoot) {
          const k = `root/${f.name}`
          this.selectedFiles[k] = this.selectedFiles[k] ?? false
        }
        this.tickedFiles = this.getSelectedfileKeys()
        this.prevTickedFiles = [...this.tickedFiles]
      } catch (err: any) {
        console.error('[LogManagement] loadRootFiles error', err)
        this.setError({ title: this.$t('common.error'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
      } finally {
        this.loading = false
      }
    },

    async loadFolders() {
      this.loading = true
      try {
        const resp: AxiosResponse<any> = await axios.get(`${API_BASE}/folders`)
        const payload = resp && resp.data ? resp.data : resp

        // payload format may vary; try to extract array of folders
        let foldersArray: any[] = []
        if (Array.isArray(payload)) {
          foldersArray = payload
        } else if (payload && Array.isArray(payload)) {
          foldersArray = payload
        } else if (payload && payload.root && Array.isArray(payload.root)) {
          // sometimes backend returns root/children structure
          const rootNode = payload.root[0]
          foldersArray = Array.isArray(rootNode?.children) ? rootNode.children : []
        } else {
          // fallback: find first array value
          for (const k of Object.keys(payload || {})) {
            if (Array.isArray(payload[k])) {
              foldersArray = payload[k]
              break
            }
          }
        }

        this.folders = (foldersArray || []).map((f: any) => {
          const name = f.label ?? f.name ?? f.folderName ?? f.key ?? 'unknown'
          return { name, key: f.key ?? name, files: [], expanded: false, loading: false, count: 0 }
        })

        // eager load files for each folder (best-effort)
        await Promise.all(this.folders.map(async (folder: any) => {
          try { await this.loadFolderFiles(folder) } catch (e) { console.warn('[LogManagement] loadFolders -> loadFolderFiles', folder, e) }
        }))

        this.tickedFiles = this.getSelectedfileKeys()
        this.prevTickedFiles = [...this.tickedFiles]
      } catch (err: any) {
        console.error('[LogManagement] loadFolders error', err)
        this.setError({ title: this.$t('common.error'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
      } finally {
        this.loading = false
      }
    },

    async loadFolderFiles(folder: any) {
      if (!folder || !folder.name) return
      folder.loading = true
      try {
        const resp: AxiosResponse<any> = await axios.get(`${API_BASE}/folders/${encodeURIComponent(folder.name)}/files`)
        const payload = resp && resp.data ? resp.data : resp
        // normalize files array
        let filesArray: any[] = []
        if (Array.isArray(payload)) filesArray = payload
        else if (Array.isArray(payload.files)) filesArray = payload.files
        else {
          for (const k of Object.keys(payload || {})) {
            if (Array.isArray(payload[k])) { filesArray = payload[k]; break }
          }
        }
        folder.files = (filesArray || []).map((f: any) => ({ ...f, name: f.name ?? f.fileName ?? f.filename ?? f.path, size: f.size ?? f.length ?? 0, lastModified: f.lastModified ?? null }))
        folder.count = folder.files.length
        // init selected map for these files
        for (const f of folder.files) {
          const k = `${folder.name}/${f.name}`
          this.selectedFiles[k] = this.selectedFiles[k] ?? false
        }
        this.tickedFiles = this.getSelectedfileKeys()
        this.prevTickedFiles = [...this.tickedFiles]
      } catch (err: any) {
        console.error('[LogManagement] loadFolderFiles error', err)
        this.setError({ title: this.$t('common.error'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
      } finally {
        folder.loading = false
      }
    },

    // --- VIEWER ---
    async openRootFile(file: any) {
      if (!file) return
      this.currentRootFile = { ...file, name: file.name }
      this.currentRootFileContent = null
      this.loading = true
      try {
        const resp: AxiosResponse<any> = await axios.get(`${API_BASE}/root/${encodeURIComponent(file.name)}`, { responseType: 'text' })
        this.currentRootFileContent = resp.data
        this.showHint = false
        this.formVisible = false
      } catch (err: any) {
        console.error('[LogManagement] openRootFile error', err)
        this.setError({ title: this.$t('common.error.downloading'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
      } finally {
        this.loading = false
      }
    },

    async openFolderFile(folder: any, file: any) {
      if (!file || !folder) return
      this.currentRootFile = { ...file, name: file.name, folderName: folder.name }
      this.currentRootFileContent = null
      this.loading = true
      try {
        const resp: AxiosResponse<any> = await axios.get(`${API_BASE}/folders/${encodeURIComponent(folder.name)}/files/${encodeURIComponent(file.name)}`, { responseType: 'text' })
        this.currentRootFileContent = resp.data
        this.showHint = false
        this.formVisible = false
      } catch (err: any) {
        console.error('[LogManagement] openFolderFile error', err)
        this.setError({ title: this.$t('common.error.downloading'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
      } finally {
        this.loading = false
      }
    },

    openTreeFile(node: any) {
      if (!node || !node.key) return
      if (String(node.key).startsWith('root/')) {
        const name = String(node.key).substring('root/'.length)
        const file = this.filesRoot.find((f: any) => f.name === name)
        if (file) this.openRootFile(file)
        return
      }
      // folder/file
      const parts = String(node.key).split('/')
      if (parts.length >= 2) {
        const folderName = parts[0]
        const fileName = parts.slice(1).join('/')
        const folder = this.folders.find((f: any) => f.name === folderName || String(f.key) === folderName)
        const file = folder?.files?.find((ff: any) => ff.name === fileName)
        if (folder && file) this.openFolderFile(folder, file)
      }
    },

    closeRootViewer() {
        this.currentRootFile = null
        this.currentRootFileContent = null
        this.showHint = true
        this.formVisible = false
        // opzionale: reset visibilità/loading se serve
        this.loading = false
    },

    // --- TICK / SELECTION LOGIC ---
    getSelectedfileKeys(): string[] {
      const all = Object.keys(this.selectedFiles).filter(k => !!this.selectedFiles[k])
      return all.filter(k => typeof k === 'string' && k.includes('/'))
    },

    onTreeTickedUpdate(ticked: string[]) {
      const prev = this.prevTickedFiles || []
      const added = (ticked || []).filter(k => !prev.includes(k))
      const removed = (prev || []).filter(k => !(ticked || []).includes(k))

      const getChildrenKeys = (nodeKey: string): string[] => {
        if (!nodeKey) return []
        if (nodeKey === 'root-files-group') return (this.filesRoot || []).map((f: any) => `root/${f.name}`)
        // folder
        const folder = (this.folders || []).find((f: any) => ('' + (f.key || f.name)) === '' + nodeKey)
        if (folder && folder.files) return folder.files.map((f: any) => `${folder.name}/${f.name}`)
        return []
      }

      const tickedSet = new Set(ticked || [])

      // if a parent/group was ticked => add all children
      for (const k of added) {
        if (k === 'root-files-group' || (this.folders || []).some(f => ('' + (f.key || f.name)) === '' + k)) {
          for (const childKey of getChildrenKeys(k)) tickedSet.add(childKey)
        }
      }
      // if parent/group was unticked => remove children
      for (const k of removed) {
        if (k === 'root-files-group' || (this.folders || []).some(f => ('' + (f.key || f.name)) === '' + k)) {
          for (const childKey of getChildrenKeys(k)) tickedSet.delete(childKey)
        }
      }

      // sync parent states
      const rootChildren = getChildrenKeys('root-files-group')
      if (rootChildren.length > 0) {
        const allRoot = rootChildren.every(k => tickedSet.has(k))
        if (allRoot) tickedSet.add('root-files-group')
        else tickedSet.delete('root-files-group')
      }
      for (const folder of (this.folders || [])) {
        const folderKey = '' + (folder.key || folder.name)
        const childKeys = getChildrenKeys(folderKey)
        if (childKeys.length === 0) {
          tickedSet.delete(folderKey)
          continue
        }
        const allSelected = childKeys.every(k => tickedSet.has(k))
        if (allSelected) tickedSet.add(folderKey)
        else tickedSet.delete(folderKey)
      }

      this.tickedFiles = Array.from(tickedSet)
      // update selectedFiles map
      this.selectedFiles = {}
      for (const k of this.tickedFiles) this.selectedFiles[k] = true
      this.prevTickedFiles = [...this.tickedFiles]
    },

    // --- DOWNLOAD ---
    async sidebarDownloadClicked() {
      const keys = this.getSelectedfileKeys()
      if (!keys || keys.length === 0) {
        this.setInfo({ title: this.$t('common.info'), msg: this.$t('managers.logManagement.noFilesSelected') ?? 'No files selected for download' })
        return
      }

      const names = Array.from(new Set(
        keys.map(k => {
          const s = ('' + k).split('/')
          return s[s.length - 1] || ''
        })
      )).filter(n => !!n)

      if (names.length === 0) {
        this.setInfo({ title: this.$t('common.info'), msg: this.$t('managers.logManagement.noFilesSelected') ?? 'No files selected for download' })
        return
      }

      const payload = { selectedLogsNames: names }
      console.log('[LogManagement] download payload (names array)', payload)

      this.loading = true
      try {
        const url = `${API_BASE}/download`
        const resp: AxiosResponse<any> = await axios.post(url, payload, {
          responseType: 'arraybuffer',
          transformResponse: [],
          headers: { 'Content-Type': 'application/json', Accept: 'application/zip' }
        })

        const contentType = (resp && resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || ''
        if (!/zip|octet-stream|application\/zip|application\/octet-stream/i.test(contentType || '')) {
          let text = ''
          try { text = new TextDecoder('utf-8').decode(resp.data) } catch (e) { text = String(resp.data) }
          this.setError({ title: this.$t('common.error.downloading'), msg: text || this.$t('common.error.refresh') })
          return
        }
        downloadDirectFromResponseWithCustomName(resp, 'logs.zip')
      } catch (err: any) {
        console.error('[LogManagement] sidebarDownloadClicked error', err)
        if (err && err.response && err.response.data) {
          let msg = ''
          try { msg = new TextDecoder('utf-8').decode(err.response.data) } catch { msg = err?.message ? String(err.message) : JSON.stringify(err) }
          this.setError({ title: this.$t('common.error.downloading'), msg: msg || this.$t('common.error.refresh') })
        } else {
          this.setError({ title: this.$t('common.error.downloading'), msg: err?.message ? String(err.message) : JSON.stringify(err) || this.$t('common.error.refresh') })
        }
      } finally {
        this.loading = false
      }
    }
  },

  computed: {
    // build nodes for q-tree applying simple filter: hides empty groups
    treeNodes(): any[] {
      const nodes: any[] = []
      const q = (this.filter || '').toLowerCase()

      const rootFiles = (this.filesRoot || []).filter((f: any) => !q || (f.name || '').toLowerCase().includes(q))
      if (rootFiles.length > 0) {
        const rootChildren = rootFiles.map((f: any) => ({ key: `root/${f.name}`, label: f.name, type: 'file', root: true }))
        nodes.push({ key: 'root-files-group', label: 'Root Files', icon: 'folder', type: 'group', children: rootChildren })
      }

      for (const folder of (this.folders || [])) {
        const matching = (folder.files || []).filter((f: any) => !q || (f.name || '').toLowerCase().includes(q))
        if (matching.length === 0) continue
        const children = matching.map((f: any) => ({ key: `${folder.name}/${f.name}`, label: f.name, type: 'file', folderName: folder.name }))
        nodes.push({ key: folder.key || folder.name, label: folder.name, icon: 'folder', type: 'folder', children })
      }

      return nodes
    }
  }
})
</script>


<style lang="scss" scoped>
/* garantisce che la colonna sidebar non venga stretta/ allargata dai figli */
.col-3.column {
  min-width: 0; /* essenziale: permette al figlio di scrollare senza espandere la colonna */
  box-sizing: border-box;
}

/* contenitore tree */
.tree-container {
  border: 1px solid var(--kn-list-border-color);
  flex: 1 0 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: auto;
}

/* search box: non partecipa allo scroll della lista */
.search-box {
  border: 1px solid var(--kn-list-border-color);
  flex: 0 0 auto;
  padding: 8px 10px;
  background: var(--kn-sidebar-bg, transparent);
  box-sizing: border-box;
}

/* tree box: area che gestisce tutti gli overflow (verticale + orizzontale) */
.tree-box {
  flex: 1 1 0;
  min-height: 0; /* essenziale per scroll interno in flex container */
  direction: rtl;
  overflow: auto;
  box-sizing: border-box;
}

/* q-tree può essere più largo del container: questo forza la scrollbar orizzontale del parent
   ma non allarga la sidebar grazie a min-width:0 sulla colonna */
.tree-box .q-tree {
  direction: ltr;
  display: inline-block;
  min-width: max-content;
  box-sizing: border-box;
}

/* contenuto nodo: non deve creare scrollbar proprie */
.q-tree__node__content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap; /* evita wrap dei nomi */
  box-sizing: border-box;
}

/* prefisso/suffix non devono spingere la larghezza */
.q-tree__node__prefix,
.q-tree__node__suffix {
  flex: 0 0 auto;
  box-sizing: border-box;
}

/* le etichette non devono avere scroll individuale */
.q-tree__node__label,
.kn-truncated,
.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

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
.file-viewer-body {
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.file-viewer {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  white-space: pre-wrap;
  overflow: auto;
  background: #fff;
  border: 1px solid #e6e6e6;
  padding: 1rem;
  margin: 0;
}

/* responsive */
@media (max-width: 480px) {
  .file-name { font-size: 0.95rem; }
}
</style>