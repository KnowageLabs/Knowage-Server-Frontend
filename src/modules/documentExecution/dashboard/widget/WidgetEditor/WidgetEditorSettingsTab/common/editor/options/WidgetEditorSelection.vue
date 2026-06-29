<template>
    <div v-if="!widgetModel.dataset" class="row items-center text-warning q-mb-sm">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <div v-else class="row q-col-gutter-sm">
        <div class="col-12">
            <q-toggle v-model="multipleValues" :label="$t('dashboard.widgetEditor.editorTags.multipleValues')" dense @update:model-value="onModeChanged" />
        </div>
        <div class="col-6">
            <q-select v-model="selectedColumnName" outlined dense emit-value map-options :options="widgetModel.columns" option-value="columnName" option-label="columnName" :label="$t('common.column')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-6">
            <q-input v-if="!multipleValues" v-model="selectionValue" outlined dense :label="$t('dashboard.widgetEditor.editorTags.selectionVal')" @update:model-value="onColumnChanged" />
            <q-select v-else v-model="selectionValues" outlined dense multiple use-chips use-input new-value-mode="add-unique" input-debounce="0" :options="[]" :label="$t('dashboard.widgetEditor.editorTags.selectionValues')" :hint="$t('dashboard.widgetEditor.editorTags.selectionValuesHint')" @update:model-value="onColumnChanged" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-selections',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            selectedColumnName: '',
            selectionValue: '',
            selectionValues: [] as string[],
            multipleValues: false
        }
    },
    watch: {
        selectionValues(newVals: string[]) {
            const trimmed = newVals.map((v) => v.trim()).filter((v) => v.length > 0)
            if (JSON.stringify(trimmed) !== JSON.stringify(newVals)) {
                this.selectionValues = trimmed
            }
        }
    },
    methods: {
        onModeChanged() {
            this.selectionValue = ''
            this.selectionValues = []
            this.onColumnChanged()
        },
        onColumnChanged() {
            const valueStr = this.multipleValues ? '[' + this.selectionValues.map((v) => `'${v}'`).join(', ') + ']' : this.selectionValue
            const forInsert = this.widgetModel.type === 'html' ? `<div kn-selection-column="${this.selectedColumnName}" kn-selection-value="${valueStr}"></div>` : `<span class="selection" kn-selection-column="${this.selectedColumnName}" kn-selection-value="${valueStr}">[kn-column='${this.selectedColumnName}']</span>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
