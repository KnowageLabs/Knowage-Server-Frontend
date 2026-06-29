<template>
    <q-layout view="hHh lpR fFf" container>
        <q-header class="bg-grey-2 text-grey-8" bordered>
            <div class="row no-wrap items-center">
                <q-tabs v-model="activeTab" dense align="left" indicator-color="primary" class="doc-browser-tabs col" @update:model-value="onTabChange">
                    <q-tab name="browser">
                        <q-icon name="folder_open" size="sm" />
                    </q-tab>
                    <q-tab v-for="(tab, index) in tabs" :key="index" :name="'tab-' + index" :label="getTabName(tab)" />
                </q-tabs>
                <div v-if="activeTab !== 'browser'" class="q-ml-auto q-mr-md">
                    <q-btn unelevated round dense icon="close" size="sm" color="grey-7" @click="openTabMenu">
                        <q-menu ref="tabMenu" auto-close>
                            <q-list dense style="min-width: 200px">
                                <q-item v-for="item in menuItems" :key="item.label" clickable @click="item.command">
                                    <q-item-section>{{ item.label }}</q-item-section>
                                </q-item>
                            </q-list>
                        </q-menu>
                    </q-btn>
                </div>
            </div>
        </q-header>

        <q-page-container>
            <q-page class="row">
                <div class="col-12">
                    <q-tab-panels v-model="activeTab" animated class="full-height">
                        <q-tab-panel name="browser" class="q-pa-none full-height">
                            <DocumentBrowserHome :document-saved="documentSaved" :document-saved-trigger="documentSavedTrigger" @itemSelected="onItemSelect($event)" />
                        </q-tab-panel>
                        <q-tab-panel v-for="(tab, index) in tabs" :key="index" :name="'tab-' + index" class="q-pa-none full-height" />
                    </q-tab-panels>

                    <DocumentBrowserTab v-show="selectedItem && selectedItem.mode" style="position: absolute; inset: 0; overflow: auto" :item="selectedItem?.item" :functionality-id="selectedItem?.functionalityId" @close="closeDocument('current')" @iframeCreated="onIFrameCreated" @closeIframe="closeIframe" @documentSaved="onDocumentSaved" />
                    <div v-for="(iframe, index) in iFrameContainers" :key="index">
                        <iframe v-show="iframe.item?.routerId === selectedItem?.item.routerId" ref="iframe" class="document-browser-cockpit-iframe" :src="iframe.iframe"></iframe>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { getRouteDocumentType } from './documentBrowserHelper'
import DocumentBrowserHome from './documentBrowserHome/DocumentBrowserHome.vue'
import DocumentBrowserTab from './DocumentBrowserTab.vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

export default defineComponent({
    name: 'document-browser',
    components: { DocumentBrowserHome, DocumentBrowserTab },
    setup() {
        const $q = useQuasar()
        const $router = useRouter()
        return { $q, $router }
    },
    props: { selectedMenuItem: { type: Object }, menuItemClickedTrigger: { type: Boolean } },
    data() {
        return {
            tabs: [] as any[],
            activeTab: 'browser',
            menuItems: [] as any[],
            selectedItem: null as any,
            id: 0,
            iFrameContainers: [] as any[],
            menuItem: null,
            documentSaved: null,
            documentSavedTrigger: false,
            getRouteDocumentType
        }
    },
    watch: {
        async menuItemClickedTrigger() {
            if (!this.selectedMenuItem) return
            if (this.selectedMenuItem.to === '/document-browser') {
                this.selectedItem = null
                this.activeTab = 'browser'
            } else if (this.selectedMenuItem.to && this.selectedMenuItem.to.includes('document-browser')) {
                await this.loadPage()
            }
        }
    },
    async created() {
        this.loadPage()
    },
    methods: {
        async loadPage() {
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'saveCockpit' && this.$router.currentRoute.value.name === 'new-cockpit') {
                    await this.loadSavedCockpit(event.data.model)
                    this.documentSaved = event.data.model
                    this.documentSavedTrigger = !this.documentSavedTrigger
                }
            })

            const id = this.$router.currentRoute.value.params.id

            if (id && id !== 'document-browser' && (this.$router.currentRoute.value.name === 'document-browser-document-execution' || this.$router.currentRoute.value.name === 'document-browser-document-details-edit' || this.$router.currentRoute.value.name === 'document-browser')) {
                let tempDocument = {} as any
                if (id !== 'new-dashboard') await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${id}`).then((response: AxiosResponse<any>) => (tempDocument = response.data))
                const tempItem = {
                    item: {
                        name: tempDocument.name,
                        label: id,
                        mode: this.$router.currentRoute.value.params.mode,
                        routerId: crypto.randomUUID(),
                        id: id,
                        showMode: this.$router.currentRoute.value.name === 'document-browser-document-execution' ? 'execute' : 'documentDetail'
                    },
                    mode: this.$router.currentRoute.value.name === 'document-browser-document-execution' && this.$router.currentRoute.value.params.id ? 'execute' : 'documentDetail'
                }
                this.tabs.push(tempItem)

                this.activeTab = 'tab-0'
                this.selectedItem = tempItem
            }
        },
        onTabChange(tabName: string) {
            if (tabName === 'browser') {
                this.selectedItem = null
                this.$router.push('/document-browser')
                return
            }

            const tabIndex = parseInt(tabName.replace('tab-', ''))
            const id = this.tabs[tabIndex].item ? this.tabs[tabIndex].item.label : 'new-dashboard'

            this.selectedItem = this.tabs[tabIndex]
            this.selectedItem.item.fromTab = true

            if (this.selectedItem.mode === 'documentDetail') {
                const path = this.selectedItem.functionalityId ? `/document-browser/document-details/new/${this.selectedItem.functionalityId}` : `/document-browser/document-details/${this.selectedItem.item.id}`
                this.$router.push(path)
            } else {
                const routeDocumentType = this.tabs[tabIndex].item.mode ? this.tabs[tabIndex].item.mode : this.getRouteDocumentType(this.tabs[tabIndex].item)
                routeDocumentType ? this.$router.push(`/document-browser/${routeDocumentType}/` + id) : this.$router.push('/document-browser/new-dashboard')
            }
        },
        onItemSelect(payload: any) {
            if (payload.item) {
                payload.item.routerId = crypto.randomUUID()
            }

            const tempItem = { ...payload, item: { ...payload.item } }
            if (payload.mode === 'documentDetail') tempItem.mode = 'documentDetail'

            this.tabs.push(tempItem)

            this.selectedItem = tempItem

            if (payload.mode === 'documentDetail') {
                const path = payload.functionalityId ? `/document-browser/document-details/new/${payload.functionalityId}` : `/document-browser/document-details/${payload.item.id}`
                this.selectedItem.item.showMode = 'documentDetail'
                this.$router.push(path)
            } else {
                const id = payload.item ? payload.item.label : 'new-dashboard'
                if (payload.item) {
                    const routeDocumentType = this.getRouteDocumentType(payload.item)
                    this.selectedItem.item.showMode = 'execute'
                    this.$router.push(`/document-browser/${routeDocumentType}/` + id)
                } else {
                    this.selectedItem.item = { routerId: crypto.randomUUID() }
                    this.selectedItem.item.showMode = payload.mode
                    const link = payload.mode === 'createCockpit' ? '/document-browser/new-cockpit' : `/document-browser/new-dashboard?folderId=${payload.functionalityId}`
                    this.$router.push(link)
                }
            }

            this.activeTab = `tab-${this.tabs.length - 1}`
        },
        openTabMenu() {
            this.createMenuItems()
        },
        createMenuItems() {
            this.menuItems = []
            this.menuItems.push({ label: this.$t('documentBrowser.closeCurrentDocument'), command: () => this.closeDocumentConfirm('current') })
            this.menuItems.push({ label: this.$t('documentBrowser.closeOtherDocuments'), command: () => this.closeDocumentConfirm('other') })
            this.menuItems.push({ label: this.$t('documentBrowser.closeDocumentRight'), command: () => this.closeDocumentConfirm('right') })
            this.menuItems.push({ label: this.$t('documentBrowser.closeAllDocuments'), command: () => this.closeDocumentConfirm('all') })
        },
        closeDocumentConfirm(mode: string) {
            this.$q
                .dialog({
                    message: this.$t('documentBrowser.closeDocumentConfirmMessage'),
                    title: this.$t('documentBrowser.closeDocumentConfirmTitle', { numberOfDocuments: this.getNumberOfDocuments(mode) }),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.closeDocument(mode))
        },
        getNumberOfDocuments(mode: string) {
            switch (mode) {
                case 'current':
                    return 1
                case 'other':
                    return this.tabs.length - 1
                case 'right':
                    return this.tabs.length - parseInt((this.activeTab as string).replace('tab-', ''))
                case 'all':
                    return this.tabs.length
            }
        },
        closeDocument(mode: string) {
            let index = -1
            switch (mode) {
                case 'current': {
                    const currentIdx = parseInt((this.activeTab as string).replace('tab-', ''))
                    this.tabs.splice(currentIdx, 1)
                    this.activeTab = 'browser'
                    index = this.iFrameContainers.findIndex((iframe: any) => iframe.item?.routerId === this.selectedItem?.item.routerId)
                    if (index !== -1) this.iFrameContainers.splice(index, 1)
                    this.$router.push('/document-browser')
                    break
                }
                case 'other': {
                    const currentIdx = parseInt((this.activeTab as string).replace('tab-', ''))
                    this.tabs = [this.tabs[currentIdx]]
                    this.activeTab = 'tab-0'
                    this.iFrameContainers = this.iFrameContainers.filter((iframe: any) => iframe.item?.routerId === this.selectedItem?.item.routerId)
                    break
                }
                case 'right': {
                    const currentIdx = parseInt((this.activeTab as string).replace('tab-', ''))
                    this.tabs.splice(currentIdx + 1)
                    index = this.iFrameContainers.findIndex((iframe: any) => iframe.item?.routerId === this.selectedItem?.item.routerId)
                    if (index !== -1) this.iFrameContainers.splice(index + 1)
                    break
                }
                case 'all':
                    this.$router.push('/document-browser')
                    this.tabs = []
                    this.activeTab = 'browser'
                    this.iFrameContainers = []
            }
        },
        onIFrameCreated(payload: any) {
            const index = this.iFrameContainers.findIndex((iframe: any) => iframe.item?.routerId === this.selectedItem?.item.routerId)
            if (index === -1) this.iFrameContainers.push(payload)
        },
        closeIframe() {
            const index = this.iFrameContainers.findIndex((iframe: any) => iframe.item?.routerId === this.selectedItem?.item.routerId)
            if (index !== -1) this.iFrameContainers.splice(index, 1)
        },
        async loadSavedCockpit(cockpit: any) {
            this.closeIframe()
            await this.$router.push(`/document-browser/document-composite/${cockpit.DOCUMENT_LABEL}?documentMode=edit`)
            setTimeout(() => {}, 2000)
            this.selectedItem = { item: { ...cockpit, routerId: crypto.randomUUID(), name: cockpit.DOCUMENT_NAME, label: cockpit.DOCUMENT_LABEL, showMode: 'execute' }, mode: 'execute' }
            const currentIdx = parseInt((this.activeTab as string).replace('tab-', ''))
            this.tabs[currentIdx] = this.selectedItem
        },
        getTabName(tab: any) {
            if (tab.item && tab.item.name) {
                return tab.item.name
            } else {
                return tab.mode === 'documentDetail' ? 'new document' : 'new dashboard'
            }
        },
        onDocumentSaved(document: any) {
            this.documentSaved = document
            this.documentSavedTrigger = !this.documentSavedTrigger
            this.selectedItem.functionalityId = null
            this.selectedItem.item = { name: document.name, label: document.id, routerId: crypto.randomUUID(), id: document.id, showMode: 'documentDetail' }
            this.$router.push(`/document-browser/document-details/${document.id}`)
        }
    }
})
</script>

<style lang="scss">
.doc-browser-tabs {
    flex: 0 0 auto;
}

.doc-browser-panels .q-tab-panel {
    padding: 0;
    height: 100%;
}

.document-browser-cockpit-iframe {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    border: none;
}
</style>
