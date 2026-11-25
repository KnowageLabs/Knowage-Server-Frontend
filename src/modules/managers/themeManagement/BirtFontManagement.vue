<template>
    <div v-if="user.isSuperadmin" class="kn-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.themeManagement.birt.title') }}</q-toolbar-title>
            <q-btn flat round dense icon="refresh" :disable="busy" :title="$t('common.refresh')" @click="loadFonts" />
            <q-btn flat round dense icon="file_upload" :disable="busy || !loaded" :title="$t('managers.themeManagement.birt.upload')" @click="pickFont" />
        </q-toolbar>
        <q-linear-progress v-if="busy" indeterminate />
        <div class="q-pa-md kn-page-content">
            <q-banner class="bg-blue-1 q-mb-md">
                {{ $t('managers.themeManagement.birt.hint') }}
            </q-banner>
            <q-banner class="bg-orange-1 q-mb-md" role="status">
                {{ $t('managers.themeManagement.birt.restart') }}
            </q-banner>
            <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md" role="alert">{{ error }}</q-banner>
            <q-file ref="picker" :model-value="null" class="hidden" accept=".ttf,.otf" :max-file-size="maxFontSize" :disable="busy || !loaded" @update:model-value="uploadFont" @rejected="error = $t('managers.themeManagement.birt.invalidFont')" />
            <dl v-if="loaded" class="birt-font-paths">
                <dt>{{ $t('managers.themeManagement.birt.directory') }}</dt>
                <dd>{{ directory }}</dd>
                <dt>{{ $t('managers.themeManagement.birt.configuration') }}</dt>
                <dd>{{ configurationPath }}</dd>
            </dl>
            <q-table v-if="loaded" flat bordered :rows="fonts" :columns="columns" row-key="name" :no-data-label="$t('common.info.noDataFound')">
                <template #body-cell-actions="props">
                    <q-td :props="props">
                        <q-btn flat round dense icon="delete" :disable="busy" :aria-label="`${$t('common.delete')}: ${props.row.name}`" @click="confirmDelete(props.row.name)" />
                    </q-td>
                </template>
            </q-table>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { QBanner, QBtn, QFile, QLinearProgress, QTable, QTd, QToolbar, QToolbarTitle } from 'quasar'
import type { QTableColumn } from 'quasar'
import axios from '@/axios.js'
import mainStore from '@/App.store'

interface BirtFont {
    name: string
    path: string
    size: number
}

const endpoint = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/birt/fonts`

export default defineComponent({
    name: 'birt-font-management',
    components: { QBanner, QBtn, QFile, QLinearProgress, QTable, QTd, QToolbar, QToolbarTitle },
    data() {
        return {
            fonts: [] as BirtFont[],
            directory: '',
            configurationPath: '',
            maxFontSize: 10 * 1024 * 1024,
            busy: false,
            loaded: false,
            error: ''
        }
    },
    computed: {
        ...mapState(mainStore, ['user']),
        columns(): QTableColumn[] {
            return [
                { name: 'name', label: this.$t('common.name'), field: 'name', align: 'left', sortable: true },
                { name: 'path', label: this.$t('managers.themeManagement.birt.path'), field: 'path', align: 'left', style: 'white-space: normal; overflow-wrap: anywhere' },
                { name: 'actions', label: '', field: 'name', align: 'right' }
            ]
        }
    },
    mounted() {
        this.loadFonts()
    },
    methods: {
        pickFont() {
            (this.$refs.picker as QFile)?.pickFiles()
        },
        async loadFonts() {
            if (this.busy || !this.user.isSuperadmin) return
            this.busy = true
            this.error = ''
            try {
                await this.refreshFonts()
            } catch {
                this.loaded = false
                this.error = this.$t('managers.themeManagement.birt.loadError')
            } finally {
                this.busy = false
            }
        },
        async refreshFonts() {
            const { data } = await axios.get(endpoint)
            this.fonts = data.items
            this.directory = data.directory
            this.configurationPath = data.configurationPath
            this.loaded = true
        },
        async uploadFont(file: File | null) {
            if (!file || this.busy || !this.loaded || !this.user.isSuperadmin) return
            this.error = ''
            if (!/^[A-Za-z0-9][A-Za-z0-9._ -]{0,179}\.(ttf|otf)$/i.test(file.name) || file.size === 0 || file.size > this.maxFontSize) {
                this.error = this.$t('managers.themeManagement.birt.invalidFont')
                return
            }
            this.busy = true
            try {
                const body = new FormData()
                body.append('file', file)
                await axios.post(endpoint, body)
            } catch (error: any) {
                const status = error.response?.status
                this.error = this.$t(`managers.themeManagement.birt.${status === 409 ? 'duplicate' : status === 400 || status === 413 ? 'invalidFont' : 'uploadError'}`)
                this.busy = false
                return
            }
            await this.refreshAfterChange()
        },
        confirmDelete(name: string) {
            if (this.busy || !this.loaded || !this.user.isSuperadmin) return
            this.$confirm.require({
                message: this.$t('managers.themeManagement.birt.deleteMessage', { name }),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteFont(name)
            })
        },
        async deleteFont(name: string) {
            if (this.busy || !this.loaded || !this.user.isSuperadmin) return
            this.busy = true
            this.error = ''
            try {
                await axios.delete(`${endpoint}/${encodeURIComponent(name)}`)
            } catch {
                this.error = this.$t('managers.themeManagement.birt.deleteError')
                this.busy = false
                return
            }
            await this.refreshAfterChange()
        },
        async refreshAfterChange() {
            try {
                await this.refreshFonts()
            } catch {
                this.loaded = false
                this.error = this.$t('managers.themeManagement.birt.refreshError')
            } finally {
                this.busy = false
            }
        }
    }
})
</script>

<style scoped>
.birt-font-paths dd {
    margin: 0 0 1rem;
    overflow-wrap: anywhere;
}
</style>
