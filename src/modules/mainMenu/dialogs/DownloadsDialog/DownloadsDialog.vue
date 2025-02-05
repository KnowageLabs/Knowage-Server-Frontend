<template>
    <Dialog class="kn-dialog--toolbar--primary downloadsDialog" :visible="visibility" footer="footer" :closable="false" modal>
        <template #header>
            <span>{{ $t('downloadsDialog.title') }}</span>
            <q-btn v-if="showRefresh" flat size="sm" round icon="refresh" @click="getDownloads">
                <q-tooltip>{{ $t('common.refresh') }}</q-tooltip>
            </q-btn>
        </template>
        <q-table class="downloadTable" flat dense :pagination="{ rowsPerPage: 10, sortBy: 'startDate', descending: true }" :rows="downloadsList" :columns="columnDefs" row-key="startDate">
            <template #body-cell-download="props">
                <q-td :props="props">
                    <q-btn flat round color="primary" size="sm" icon="download" @click="downloadContent(props.row)" />
                    <q-tooltip>{{ $t('common.download') }}</q-tooltip>
                </q-td>
            </template>
        </q-table>

        <template #footer>
            <Button class="kn-button p-button-danger" :disabled="downloadsList.length == 0" @click="deleteAllDownloads">{{ $t('common.deleteAll') }}</Button>
            <Button class="kn-button--primary" @click="closeDialog">{{ $t('common.close') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import { AxiosResponse } from 'axios'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { mapState, mapActions } from 'pinia'
import mainStore from '@/App.store'

interface Download {
    filename: string
    startDate: Date
    alreadyDownloaded: boolean
}
export default defineComponent({
    name: 'role-dialog',
    components: {
        Column,
        DataTable,
        Dialog
    },
    props: {
        visibility: Boolean
    },
    emits: ['update:visibility'],
    data() {
        return {
            columnDefs: {},
            downloadsList: new Array<Download>(),
            gridOptions: {}
        }
    },
    watch: {
        visibility(newVisibility, oldVisibility) {
            if (newVisibility != oldVisibility) this.getDownloads()
        }
    },
    beforeMount() {
        this.gridOptions = { headerHeight: 30 }
        this.columnDefs = [
            {
                align: 'left',
                field: 'filename',
                headerStyle: 'text-transform:capitalize',
                label: this.$t('downloadsDialog.columns.fileName'),
                name: 'filename',
                sortable: true
            },
            {
                field: 'startDate',
                headerStyle: 'text-transform:capitalize',
                label: this.$t('downloadsDialog.columns.creationDate'),
                name: 'startDate',
                sortable: true,
                format: (val) => this.getDate(val)
            },
            {
                name: 'download'
            }
        ]
    },
    mounted() {
        this.getDownloads()
    },
    computed: {
        ...mapState(mainStore, {
            configurations: 'configurations'
        }),
        showRefresh() {
            return this.configurations['KNOWAGE.DOWNLOAD.MANUAL_REFRESH']
        }
    },
    methods: {
        ...mapActions(mainStore, ['updateAlreadyDownloadedFiles', 'setDownloads']),
        closeDialog() {
            this.$emit('update:visibility', false)
        },
        getDate(date) {
            return formatDateWithLocale(date, {
                dateStyle: 'long',
                timeStyle: 'short'
            })
        },
        getDownloads() {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/export/dataset?showAll=true').then(
                (response: AxiosResponse<any>) => {
                    this.downloadsList = response.data
                    let unRead = response.data.filter((i) => i.alreadyDownloaded)
                    this.setDownloads({ count: { total: response.data.length, alreadyDownloaded: unRead.length } })
                },
                (error) => console.error(error)
            )
        },
        async downloadContent(data) {
            const encodedUri = encodeURI(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/export/dataset/' + data.id)
            await this.$http
                .get(encodedUri, {
                    responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
                    }
                })
                .then(
                    (response: AxiosResponse<any>) => {
                        if (!data.alreadyDownloaded) {
                            this.updateAlreadyDownloadedFiles()
                        }
                        downloadDirectFromResponse(response)
                    },
                    (error) => console.error(error)
                )
            this.getDownloads()
        },
        deleteAllDownloads() {
            this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/export').then(
                () => {
                    this.downloadsList = []
                    this.setDownloads({ count: { total: 0, alreadyDownloaded: 0 } })
                    this.closeDialog()
                },
                (error) => console.error(error)
            )
        }
    }
})
</script>
<style lang="scss">
.downloadsDialog {
    .p-dialog-header-icons {
        display: none !important;
    }
    .downloadTable {
        min-width: 600px;
        max-width: 80%;
    }
}
</style>
