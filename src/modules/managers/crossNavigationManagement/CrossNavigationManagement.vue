<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="400" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar :class="['kn-toolbar', secondary ? 'kn-toolbar--secondary' : 'kn-toolbar--primary']">
                        <q-toolbar-title>{{ $t('managers.crossNavigationManagement.title') }}</q-toolbar-title>
                        <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm(-1)" />
                    </q-toolbar>
                    <q-linear-progress v-if="loading" indeterminate color="primary" class="kn-progress-bar" data-test="progress-bar" />
                    <KnListBox v-if="!loading" class="col kn-height-full" :options="navigations" :settings="crossNavigationDescriptor.knListSettings" @click="selected" @delete.stop="deleteTempateConfirm" />
                </q-drawer>
                <div class="col">
                    <CrossNavigationManagementDetail v-if="selectedId !== null" :id="selectedId === 'new' ? undefined : selectedId" :secondary="secondary" @close="closeForm" @touched="onTouched" @saved="reload" @toggle-drawer="drawerVisible = !drawerVisible" />
                    <KnHint v-else :title="'managers.crossNavigationManagement.title'" :hint="'managers.crossNavigationManagement.hint'" />
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iNavigation } from './CrossNavigationManagement'
import { AxiosResponse } from 'axios'
import { useQuasar } from 'quasar'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import KnHint from '@/components/UI/KnHint.vue'
import CrossNavigationManagementDetail from './CrossNavigationManagementDetail.vue'
import crossNavigationDescriptor from './CrossNavigationManagementDescriptor.json'
import mainStore from '../../../App.store'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'navigation-management',
    components: { KnFabButton, KnListBox, KnHint, CrossNavigationManagementDetail },
    props: {
        secondary: { type: Boolean, default: false }
    },
    emits: ['touched'],
    setup() {
        const store = mainStore()
        const $q = useQuasar()
        return { store, $q }
    },
    data() {
        return {
            navigations: [] as iNavigation[],
            loading: false,
            touched: false,
            drawerVisible: true,
            selectedId: null as string | null,
            crossNavigationDescriptor
        }
    },
    created() {
        this.loadAll()
    },
    methods: {
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
                    this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    await this.loadAll()
                    if (String(itemId) === this.selectedId) this.selectedId = null
                })
                .catch((error) =>
                    this.store.setError({
                        title: this.$t('common.error.generic'),
                        msg: error.message
                    })
                )
                .finally(() => (this.loading = false))
        },
        showForm(id: number) {
            const newId = id !== -1 ? String(id) : 'new'
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
            this.$emit('touched')
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
