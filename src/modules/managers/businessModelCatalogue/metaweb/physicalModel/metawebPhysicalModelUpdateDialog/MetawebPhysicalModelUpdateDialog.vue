<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="metawebPhysicalModelUpdateDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('metaweb.updatePhysicalModel.title') }}
                </template>
            </Toolbar>
        </template>
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <MetawebUpdateChangedLists v-if="step === 0" :changed-item="data"></MetawebUpdateChangedLists>
        <MetawebUpdatePhysicalTablesSelect v-else :changed-item="data" @selected="onTablesSelect"></MetawebUpdatePhysicalTablesSelect>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" data-test="save-button" @click="save"> {{ step === 0 ? $t('common.next') + ' >' : $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'

import { iChangedData } from '../../Metaweb'
import Dialog from 'primevue/dialog'
import metawebPhysicalModelUpdateDialogDescriptor from './MetawebPhysicalModelUpdateDialogDescriptor.json'
import MetawebUpdateChangedLists from './MetawebUpdateChangedLists.vue'
import MetawebUpdatePhysicalTablesSelect from './MetawebUpdatePhysicalTablesSelect.vue'
import mainStore from '../../../../../../App.store'

export default defineComponent({
    name: 'metaweb-physical-model-update-dialog',
    components: { Dialog, MetawebUpdateChangedLists, MetawebUpdatePhysicalTablesSelect },
    props: { visible: { type: Boolean }, changedItem: { type: Object as PropType<iChangedData> } },
    emits: ['close', 'updated'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            metawebPhysicalModelUpdateDialogDescriptor,
            data: null as iChangedData | null,
            tables: [] as string[],
            step: 0,
            loading: false
        }
    },
    watch: {
        changedItem() {
            this.loadData()
        }
    },
    async created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.data = this.changedItem as iChangedData
        },
        closeDialog() {
            this.$emit('close')
            this.step = 0
            this.tables = []
        },
        onTablesSelect(selectedTables: { value: string }[]) {
            this.tables = selectedTables.map((el: any) => el.value)
        },
        async save() {
            if (this.step === 0) {
                this.step = 1
            } else {
                await this.updatePhysicalModel()
            }
        },
        async updatePhysicalModel() {
            this.loading = true
            await this.$http
                .post(import.meta.env.VITE_KNOWAGEMETA_CONTEXT + `/restful-services/1.0/metaWeb/updatePhysicalModel`, { tables: this.tables })
                .then((response: AxiosResponse<any>) => {
                    this.store.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.updateSuccess')
                    })
                    this.$emit('updated', response.data)
                    this.tables = []
                    this.step = 0
                })
                .catch(() => {})

            this.loading = false
        }
    }
})
</script>
