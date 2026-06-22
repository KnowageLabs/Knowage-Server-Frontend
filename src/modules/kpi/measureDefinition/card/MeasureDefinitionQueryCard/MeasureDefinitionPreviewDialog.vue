<template>
    <Dialog :style="previewDialogDescriptor.dialog.style" :content-style="previewDialogDescriptor.dialog.contentStyle" :visible="true" :modal="true" class="p-fluid kn-dialog--toolbar--primary" :header="$t('kpi.measureDefinition.preview')" :closable="false">
        <div class="preview-body p-d-flex p-flex-row">
            <div class="kn-flex p-p-3">
                <q-card flat bordered>
                    <DataTable :value="rows" class="p-datatable-sm kn-table" data-key="id" responsive-layout="stack" breakpoint="960px">
                        <template #empty>
                            {{ $t('common.info.noDataFound') }}
                        </template>
                        <Column v-for="col of columns" :key="col.field" class="kn-truncated" :field="col.name" :header="col.label" :sortable="true"> </Column>
                    </DataTable>
                </q-card>
            </div>

            <div v-if="rule.placeholders && rule.placeholders.length > 0" class="filters-panel p-d-flex p-flex-column">
                <Toolbar class="kn-toolbar kn-toolbar--secondary p-m-0">
                    <template #start>
                        {{ $t('kpi.measureDefinition.filters') }}
                    </template>
                    <template #end>
                        <Button class="kn-button p-button-text p-button-rounded" @click="loadPreview">{{ $t('common.run') }}</Button>
                    </template>
                </Toolbar>
                <div class="kn-flex">
                    <div v-for="placeholder in rule.placeholders" :key="placeholder.id">
                        <div class="p-field p-m-3">
                            <span class="p-float-label">
                                <InputText v-model.trim="placeholder.value" class="kn-material-input" type="text" />
                                <label class="kn-material-input-label"> {{ placeholder.name }} </label>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.close')" @click="closeTemplate"></Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iRule } from '../../MeasureDefinition'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import previewDialogDescriptor from './MeasureDefinitionPreviewDialogDescriptor.json'

export default defineComponent({
    name: 'measure-definition-preview-dialog',
    components: { Column, DataTable, Dialog },
    props: {
        currentRule: {
            type: Object,
            required: true
        },
        placeholders: {
            type: Array,
            required: true
        },
        columns: { type: Array },
        propRows: { type: Array }
    },
    emits: ['close', 'loadPreview'],
    data() {
        return {
            previewDialogDescriptor,
            rule: {} as iRule,
            rows: [] as any[]
        }
    },
    watch: {
        propRows() {
            this.loadRows()
        },
        currentRule() {
            this.loadRule()
        }
    },
    async created() {
        this.loadRule()
        this.loadRows()
    },
    methods: {
        loadRule() {
            this.rule = this.currentRule as iRule
        },
        loadPreview() {
            this.$emit('loadPreview')
        },
        loadRows() {
            this.rows = this.propRows as any[]
        },
        closeTemplate() {
            this.$emit('close')
        }
    }
})
</script>
<style lang="scss" scoped>
:deep(.p-dialog-content) {
    padding: 0 !important;
}

.preview-body {
    min-height: 400px;
}

.filters-panel {
    width: 280px;
    min-width: 280px;
    border-left: 1px solid var(--kn-color-borders, #dee2e6);
}
</style>
