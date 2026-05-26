<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="400" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title>{{ $t('managers.crossNavigationManagement.title') }}</q-toolbar-title>
                        <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm(-1)" />
                    </q-toolbar>
                    <q-linear-progress v-if="loading" indeterminate color="primary" class="kn-progress-bar" data-test="progress-bar" />
                    <KnListBox v-if="!loading" class="col kn-height-full" :options="navigations" :settings="crossNavigationDescriptor.knListSettings" @click="selected" @delete.stop="deleteTempateConfirm" />
                </q-drawer>
                <div class="col">
                    <router-view @close="closeForm" @touched="touched = true" @saved="reload" @toggle-drawer="drawerVisible = !drawerVisible" />
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
import { useRouter, useRoute } from 'vue-router'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import crossNavigationDescriptor from './CrossNavigationManagementDescriptor.json'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'navigation-management',
    components: { KnFabButton, KnListBox },
    setup() {
        const store = mainStore()
        const router = useRouter()
        const route = useRoute()
        const $q = useQuasar()
        return { store, router, route, $q }
    },
    data() {
        return {
            navigations: [] as iNavigation[],
            loading: false,
            touched: false,
            drawerVisible: true,
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
                    if (String(itemId) === this.route.params.id) this.router.push('/cross-navigation-management')
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
            const path = id !== -1 ? '/cross-navigation-management/' + id : '/cross-navigation-management/new-navigation'
            if (!this.touched) {
                this.router.push(path)
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
                        this.router.push(path)
                    })
            }
        },
        closeForm() {
            if (!this.touched) {
                this.handleClose()
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
                        this.handleClose()
                    })
            }
        },
        handleClose() {
            this.router.replace('/cross-navigation-management')
        },
        async reload(operation: string, name: string) {
            await this.loadAll()
            this.touched = false
            if (operation === 'insert') {
                const id = this.navigations.find((nav) => nav.name === name)?.id
                this.router.push('/cross-navigation-management/' + id)
            }
        }
    }
})
</script>
