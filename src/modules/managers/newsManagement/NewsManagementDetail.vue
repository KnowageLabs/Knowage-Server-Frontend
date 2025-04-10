<template>
    <Toolbar class="kn-toolbar kn-toolbar--primary p-m-0">
        <template #start>{{ $t('managers.newsManagement.detailTitle') }}</template>
        <template #end>
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="invalid" data-test="submit-button" @click="handleSubmit" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="closeTemplateConfirm" />
        </template>
    </Toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
    <div class="card">
        <NewsDetailCard :selected-news="selectedNews" @fieldChanged="onFieldChange"></NewsDetailCard>
    </div>
    <div class="card">
        <RolesCard :category-list="roleList" :selected="selectedNews.roles" @changed="setSelectedRoles($event)"></RolesCard>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iNews, iRole } from './NewsManagement'
import { AxiosResponse } from 'axios'
import NewsDetailCard from './cards/NewsDetailCard/NewsDetailCard.vue'
import newsManagementDetailDescriptor from './NewsManagementDetailDescriptor.json'
import RolesCard from './cards/RolesCard/RolesCard.vue'
import WEB_SOCKET from '@/services/webSocket.js'
import mainStore from '../../../App.store'

export default defineComponent({
    components: {
        NewsDetailCard,
        RolesCard
    },
    props: {
        id: {
            type: String,
            required: false
        }
    },
    emits: ['touched', 'closed', 'inserted'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            newsManagementDetailDescriptor,
            selectedNews: {
                type: 1,
                roles: []
            } as iNews,
            roleList: [] as iRole[],
            loading: false,
            touched: false,
            operation: 'insert'
        }
    },
    computed: {
        invalid(): any {
            return this.selectedNews.title == null || this.selectedNews.expirationDate == null || this.selectedNews.description == null || this.selectedNews.type == null
        }
    },
    watch: {
        id() {
            this.loadSelectedNews()
        }
    },
    async created() {
        await this.loadSelectedNews()
        await this.loadRoles()
    },
    methods: {
        async loadSelectedNews() {
            this.loading = true
            if (this.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/news/${this.id}?isTechnical=true`).then((response: AxiosResponse<any>) => (this.selectedNews = { ...response.data, expirationDate: new Date(response.data.expirationDate) }))
            } else {
                this.selectedNews = {
                    type: 1,
                    roles: []
                } as iNews
            }
            this.loading = false
        },
        async loadRoles() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles')
                .then((response: AxiosResponse<any>) => {
                    this.roleList = response.data
                })
                .finally(() => (this.loading = false))
        },
        async handleSubmit() {
            if (this.invalid) {
                return
            }

            if (this.selectedNews.id) {
                this.operation = 'update'
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/news', { ...this.selectedNews, expirationDate: new Date(this.selectedNews.expirationDate as string).valueOf() })
                .then(() => {
                    this.store.setInfo({
                        title: this.$t(this.newsManagementDetailDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.newsManagementDetailDescriptor.operation.success)
                    })
                    this.$emit('inserted')
                    WEB_SOCKET.send(JSON.stringify(this.selectedNews))
                    this.$router.replace('/news-management')
                })
                .catch(() => {})
        },
        setDirty() {
            this.touched = true
            this.$emit('touched')
        },
        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.closeTemplate()
                    }
                })
            }
        },
        closeTemplate() {
            this.$router.push('/news-management')
            this.$emit('closed')
        },
        setSelectedRoles(roles: iRole[]) {
            this.selectedNews.roles = roles
            this.touched = true
            this.$emit('touched')
        },
        onFieldChange(event: any) {
            this.selectedNews[event.fieldName] = event.value
            this.touched = true
            this.$emit('touched')
        }
    }
})
</script>
