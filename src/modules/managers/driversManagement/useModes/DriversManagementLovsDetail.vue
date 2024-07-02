<template>
    <div class="p-mb-3">
        <Button :label="$t('managers.driversManagement.useModes.backToList')" icon="pi pi-arrow-left" class="p-button-text" style="width: 120px" @click="$emit('close')" />
    </div>
    <form class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col-4">
            <span class="p-float-label">
                <InputText id="label" v-model="selectedLov.label" class="kn-material-input" type="text" disabled />
                <label for="label" class="kn-material-input-label">{{ $t('common.label') }} </label>
            </span>
        </div>
        <div class="p-field p-col-4">
            <span class="p-float-label">
                <InputText id="name" v-model="selectedLov.name" class="kn-material-input" type="text" disabled />
                <label for="name" class="kn-material-input-label">{{ $t('common.name') }} </label>
            </span>
        </div>
        <div class="p-field p-col-4">
            <span class="p-float-label">
                <InputText id="type" v-model="selectedLov.itypeCd" class="kn-material-input" type="text" disabled />
                <label for="type" class="kn-material-input-label">{{ $t('common.type') }} </label>
            </span>
        </div>
        <div class="p-field p-col-12">
            <span class="p-float-label">
                <InputText id="desc" v-model="selectedLov.description" class="kn-material-input" type="text" disabled />
                <label for="desc" class="kn-material-input-label">{{ $t('common.description') }} </label>
            </span>
        </div>
        <knMonaco v-if="editorVisible" ref="editor" v-model="code" style="height: 400px" :language="language"></knMonaco>
        <DataTable v-if="selectedLov.itypeCd === 'FIX_LOV'" :value="rows" class="p-datatable-sm kn-table" responsive-layout="stack">
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>

            <Column field="VALUE" :header="$t('common.value')" class="kn-truncated"></Column>
            <Column field="DESCRIPTION" :header="$t('common.description')" class="kn-truncated"></Column>
        </DataTable>
        <div v-if="selectedLov.itypeCd === 'DATASET' || selectedLov.itypeCd === 'JAVACLASS'" class="p-field p-col-6">
            <span class="p-float-label">
                <InputText id="label" v-model="label" class="kn-material-input" type="text" disabled />
                <label for="label" class="kn-material-input-label">{{ $t('common.label') }} </label>
            </span>
        </div>
        <div v-if="selectedLov.itypeCd === 'DATASET' || selectedLov.itypeCd === 'JAVACLASS'" class="p-field p-col-6">
            <span class="p-float-label">
                <InputText id="description" v-model="name" class="kn-material-input" type="text" disabled />
                <label for="description" class="kn-material-input-label">{{ $t('common.name') }} </label>
            </span>
        </div>
    </form>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import useModeDescriptor from './UseModesDescriptor.json'
import { decode } from 'js-base64'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
export default defineComponent({
    name: 'lovs-detail',
    components: {
        Column,
        DataTable,
        knMonaco
    },
    props: {
        lov: {
            type: Object,
            required: false
        }
    },
    emits: ['close', 'apply'],
    data() {
        return {
            selectedLov: {} as any,
            language: 'sql',
            useModeDescriptor,
            code: '',
            rows: [],
            editorVisible: false,
            label: null,
            name: null
        }
    },
    watch: {
        lov() {
            this.selectedLov = { ...this.lov }
            this.decode()
        }
    },
    mounted() {
        this.selectedLov = { ...this.lov }
        this.decode()
    },
    methods: {
        escapeXml(value: string) {
            return value
                .replace(/'/g, "'")
                .replace(/"/g, '"')
                .replace(/>/g, '>')
                .replace(/</g, '<')
                .replace(/&/g, '&')
                .replace(/&apos;/g, "'")
        },
        decode() {
            if (this.selectedLov.itypeCd === 'QUERY') {
                this.editorVisible = true
                this.language = 'sql'
                const x = JSON.parse(this.lov?.lovProviderJSON)
                this.code = this.escapeXml(decode(x.QUERY.STMT))
            } else if (this.selectedLov.itypeCd === 'SCRIPT') {
                this.editorVisible = true
                this.language = 'javascript'
                const x = JSON.parse(this.lov?.lovProviderJSON)
                this.code = this.escapeXml(decode(x.SCRIPTLOV.SCRIPT))
            } else if (this.selectedLov.itypeCd === 'FIX_LOV') {
                this.editorVisible = false
                const x = JSON.parse(this.lov?.lovProviderJSON)
                Array.isArray(x.FIXLISTLOV.ROWS.ROW) ? (this.rows = x.FIXLISTLOV.ROWS.ROW) : (this.rows = Object.values(x.FIXLISTLOV.ROWS))
            } else if (this.selectedLov.itypeCd === 'DATASET') {
                this.editorVisible = false
                const x = JSON.parse(this.lov?.lovProviderJSON)
                this.label = x.DATASET.LABEL
            } else if (this.selectedLov.itypeCd === 'JAVACLASS') {
                this.editorVisible = false
                const x = JSON.parse(this.lov?.lovProviderJSON)
                this.label = x.JAVACLASS.label
                this.name = x.JAVACLASS.name
            }
        }
    }
})
</script>
