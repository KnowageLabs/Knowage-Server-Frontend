<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="400" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                        <q-toolbar-title>{{ $t('managers.crossNavigationManagement.title') }}</q-toolbar-title>
                        <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm(-1)" />
                    </q-toolbar>
                    <q-linear-progress v-if="loading" indeterminate color="primary" class="kn-progress-bar" />
                    <q-tabs v-model="filterMode" dense no-caps align="justify" class="bg-grey-1 text-grey-7" style="border-right: 1px solid #cccccc; border-bottom: 1px solid #cccccc" active-color="primary" indicator-color="primary">
                        <q-tab name="source" :label="$t('managers.crossNavigationManagement.filterSource')" />
                        <q-tab name="target" :label="$t('managers.crossNavigationManagement.filterTarget')" />
                        <q-tab name="both" :label="$t('managers.crossNavigationManagement.filterBoth')" />
                    </q-tabs>
                    <KnListBox v-if="!loading" class="col kn-height-full" :options="filteredNavigations" :settings="listSettings" @click="selected" @delete.stop="deleteTempateConfirm" />
                </q-drawer>
                <div class="col">
                    <CrossNavigationManagementDetail v-if="selectedId !== null" :id="selectedId === 'new' ? undefined : selectedId" :secondary="true" :preset-origin-doc="selectedId === 'new' ? presetOriginDoc : undefined" @close="closeForm" @touched="onTouched" @saved="reload" @toggle-drawer="drawerVisible = !drawerVisible" />
                    <KnHint v-else :title="'managers.crossNavigationManagement.title'" :hint="'managers.crossNavigationManagement.hint'" />
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import { iNavigation } from '@/modules/managers/crossNavigationManagement/CrossNavigationManagement.d'
import { AxiosResponse } from 'axios'
import { useQuasar } from 'quasar'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import KnHint from '@/components/UI/KnHint.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import CrossNavigationManagementDetail from '@/modules/managers/crossNavigationManagement/CrossNavigationManagementDetail.vue'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import crossNavigationDescriptor from '@/modules/managers/crossNavigationManagement/CrossNavigationManagementDescriptor.json'

export default defineComponent({
    name: 'dashboard-cross-navigation',
    components: { KnFabButton, KnHint, KnListBox, CrossNavigationManagementDetail },
    props: {
        dashboardId: { type: String, required: true }
    },
    setup() {
        const appStore = mainStore()
        const $q = useQuasar()
        return { appStore, $q }
    },
    data() {
        return {
            navigations: [] as iNavigation[],
            loading: false,
            touched: false,
            drawerVisible: true,
            selectedId: null as string | null,
            filterMode: 'source' as 'source' | 'both' | 'target'
        }
    },
    computed: {
        dashboardDocument(): any {
            return this.getDashboard(this.dashboardId)?.document ?? null
        },
        presetOriginDoc(): any {
            if (!this.dashboardDocument) return undefined
            return {
                DOCUMENT_ID: this.dashboardDocument.id,
                DOCUMENT_LABEL: this.dashboardDocument.label,
                DOCUMENT_NAME: this.dashboardDocument.name
            }
        },
        listSettings(): any {
            const { sortFields, defaultSortField, ...rest } = crossNavigationDescriptor.knListSettings as any
            return { ...rest, fullTextSearch: true }
        },
        filteredNavigations(): iNavigation[] {
            const label = this.dashboardDocument?.label
            if (!label) return this.navigations
            if (this.filterMode === 'source') return this.navigations.filter((nav: any) => nav.fromDoc === label)
            if (this.filterMode === 'target') return this.navigations.filter((nav: any) => nav.toDoc === label)
            return this.navigations.filter((nav: any) => nav.fromDoc === label || nav.toDoc === label)
        }
    },
    created() {
        this.loadAll()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboard']),
        async loadAll() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/crossNavigation/listNavigation/')
                .then((response: AxiosResponse<any>) => (this.navigations = response.data))
                .finally(() => (this.loading = false))
        },
        selected(e: any) {
            if (e.item && e.item.id) this.showForm(e.item.id)
        },
        showForm(id: number | undefined) {
            const newId = id !== undefined && id !== -1 ? String(id) : 'new'
            if (!this.touched) {
                this.selectedId = newId
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.unsavedChangesHeader'),
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.touched = false
                        this.selectedId = newId
                    })
            }
        },
        closeForm() {
            if (!this.touched) {
                this.selectedId = null
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.unsavedChangesHeader'),
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.touched = false
                        this.selectedId = null
                    })
            }
        },
        onTouched() {
            this.touched = true
        },
        deleteTempateConfirm(event: any): void {
            this.$q
                .dialog({
                    title: this.$t('common.toast.deleteTitle'),
                    message: this.$t('common.toast.deleteMessage'),
                    cancel: true,
                    persistent: true
                })
                .onOk(async () => await this.deleteTemplate(event.item.id))
        },
        async deleteTemplate(itemId: number) {
            this.loading = true
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/crossNavigation/remove', "{'id':" + itemId + '}')
                .then(async () => {
                    this.appStore.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    await this.loadAll()
                    if (String(itemId) === this.selectedId) this.selectedId = null
                })
                .catch((error) => this.appStore.setError({ title: this.$t('common.error.generic'), msg: error.message }))
                .finally(() => (this.loading = false))
        },
        canLeave(): Promise<boolean> {
            return new Promise((resolve) => {
                if (!this.touched) {
                    resolve(true)
                    return
                }
                this.$q
                    .dialog({
                        title: this.$t('common.toast.unsavedChangesHeader'),
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.touched = false
                        resolve(true)
                    })
                    .onCancel(() => resolve(false))
            })
        },
        async reload(operation: string, name: string) {
            await this.loadAll()
            this.touched = false
            if (operation === 'insert') {
                const id = this.navigations.find((nav: iNavigation) => nav.name === name)?.id
                if (id) this.selectedId = String(id)
            }
            emitter.emit('crossNavigationsUpdated')
        }
    }
})
</script>
